import cors from "cors";
import "dotenv/config";
import express from "express";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { unlink } from "node:fs/promises";
import helmet from "helmet";
import { GoogleGenAI } from "@google/genai";
import { rateLimit } from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import morgan from "morgan";
import multer from "multer";
import { generateMobileHelp } from "./mobileHelp.js";
import { retryProviderRequest, transcribeWithFallback } from "./transcription.js";

const app = express();
const uploadDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "uploads",
);
const publicDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const acceptedAudioTypes = new Set([
  "audio/flac",
  "audio/mp3",
  "audio/mp4",
  "audio/mpeg",
  "audio/mpga",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/x-flac",
  "audio/x-m4a",
  "audio/x-wav",
]);
const acceptedImageTypes = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_req, _file, callback) => {
      callback(null, `${randomUUID()}.audio`);
    },
  }),
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!acceptedAudioTypes.has(file.mimetype)) {
      callback(new Error("Unsupported audio type. Upload an audio file."));
      return;
    }

    callback(null, true);
  },
});

const helpImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 4,
    fields: 1,
    fieldSize: 12 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!acceptedImageTypes.has(file.mimetype)) {
      callback(new Error("Unsupported image type. Upload a PNG, JPEG, GIF, or WebP image."));
      return;
    }

    callback(null, true);
  },
});

const transcriptionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: "Too many transcription requests. Try again in 15 minutes.",
    });
  },
});

const mobileHelpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: "Too many help requests. Try again in 15 minutes.",
    });
  },
});

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(express.static(publicDirectory));
app.use("/api/transcriptions", transcriptionRateLimit);
app.use("/api/help", mobileHelpRateLimit);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/transcriptions", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    res
      .status(400)
      .json({ error: 'An audio file is required in the "audio" field.' });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    await removeUpload(req.file.path);
    res
      .status(503)
      .json({ error: "Transcription is not configured. Set GEMINI_API_KEY." });
    return;
  }

  let client;
  let audioFile;

  try {
    client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { timeout: 60_000 },
    });
    audioFile = await retryProviderRequest(
      () =>
        client.files.upload({
          file: req.file.path,
          config: { mimeType: req.file.mimetype },
        }),
      "Audio upload to Gemini",
    );
    const text = await transcribeWithFallback(
      client,
      audioFile,
      process.env.GEMINI_TRANSCRIPTION_MODEL || "gemini-3.5-transcribe",
      process.env.GEMINI_TRANSCRIPTION_FALLBACK_MODEL || "gemini-3.8-flash",
    );

    res.json({ text });
  } catch (error) {
    console.error("Audio transcription failed:", error);
    res
      .status(502)
      .json({ error: "The transcription provider could not process this audio." });
  } finally {
    if (client && audioFile?.name) {
      try {
        await client.files.delete({ name: audioFile.name });
      } catch (error) {
        console.error("Failed to remove temporary audio from Gemini:", error);
      }
    }

    await removeUpload(req.file.path);
  }
});

app.post("/api/help", helpImageUpload.array("images", 4), async (req, res) => {
  const transcription = req.body?.transcription;

  if (
    typeof transcription !== "string" ||
    !transcription.trim() ||
    transcription.length > 6000
  ) {
    res.status(400).json({
      error: "Provide a transcription between 1 and 6000 characters.",
    });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res
      .status(503)
      .json({ error: "Mobile help is not configured. Set GEMINI_API_KEY." });
    return;
  }

  try {
    const client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { timeout: 60_000 },
    });
    const help = await retryProviderRequest(
      () =>
        generateMobileHelp(
          client,
          transcription.trim(),
          req.files ?? [],
          process.env.GEMINI_HELP_MODEL || "gemini-3.5-flash",
        ),
      "Mobile help generation",
    );

    res.json(help);
  } catch (error) {
    console.error("Mobile help generation failed:", error);
    res
      .status(502)
      .json({
        error:
          "Gemini could not generate help steps right now. Please try again.",
      });
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    res.status(status).json({ error: error.message });
    return;
  }

  if (error.message === "Unsupported audio type. Upload an audio file.") {
    res.status(415).json({ error: error.message });
    return;
  }

  if (
    error.message ===
    "Unsupported image type. Upload a PNG, JPEG, GIF, or WebP image."
  ) {
    res.status(415).json({ error: error.message });
    return;
  }

  console.error("Request failed:", error);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

async function removeUpload(filePath) {
  try {
    await unlink(filePath);
  } catch (error) {
    console.error("Failed to remove temporary audio upload:", error);
  }
}

export default app;
