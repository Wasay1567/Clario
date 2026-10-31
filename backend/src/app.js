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

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(express.static(publicDirectory));
app.use("/api/transcriptions", transcriptionRateLimit);

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
