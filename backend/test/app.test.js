import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import app from "../src/app.js";
import { transcribeWithFallback } from "../src/transcription.js";

let server;
let baseUrl;

before(async () => {
  server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /health reports that the API is ready", async () => {
  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("GET / serves the audio transcription page", async () => {
  const response = await fetch(`${baseUrl}/`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  const page = await response.text();
  assert.match(page, /Audio transcription/);
  assert.match(page, /<script src="\/app\.js" defer><\/script>/);
  assert.doesNotMatch(page, /<script>[\s\S]*?<\/script>/);
});

test("GET /app.js serves the browser transcription handler", async () => {
  const response = await fetch(`${baseUrl}/app.js`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /javascript/);
  assert.match(await response.text(), /fetch\("\/api\/transcriptions"/);
});

test("POST /api/transcriptions requires an audio file", async () => {
  const response = await fetch(`${baseUrl}/api/transcriptions`, {
    method: "POST",
    body: new FormData(),
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /audio file is required/i);
});

test("POST /api/transcriptions reports when Gemini is not configured", async () => {
  const originalApiKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const form = new FormData();
    form.append("audio", new Blob(["audio"], { type: "audio/mpeg" }), "voice.mp3");

    const response = await fetch(`${baseUrl}/api/transcriptions`, {
      method: "POST",
      body: form,
    });

    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /GEMINI_API_KEY/);
  } finally {
    if (originalApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalApiKey;
    }
  }
});

test("POST /api/transcriptions rejects unsupported file types", async () => {
  const form = new FormData();
  form.append("audio", new Blob(["not audio"], { type: "text/plain" }), "notes.txt");

  const response = await fetch(`${baseUrl}/api/transcriptions`, {
    method: "POST",
    body: form,
  });

  assert.equal(response.status, 415);
  assert.match((await response.json()).error, /unsupported audio type/i);
});

test("transcription retries temporary provider errors", async () => {
  let attempts = 0;
  const client = {
    interactions: {
      create: async () => {
        attempts += 1;
        if (attempts === 1) {
          const error = new Error("Temporary provider failure");
          error.status = 503;
          throw error;
        }
        return { output_text: "Recovered transcript" };
      },
    },
  };

  const text = await transcribeWithFallback(
    client,
    { uri: "files/audio", mimeType: "audio/mpeg" },
    "primary-model",
    "fallback-model",
  );

  assert.equal(text, "Recovered transcript");
  assert.equal(attempts, 2);
});

test("transcription falls back to another model after a model error", async () => {
  const requestedModels = [];
  const client = {
    interactions: {
      create: async ({ model }) => {
        requestedModels.push(model);
        if (model === "primary-model") {
          const error = new Error("Model not found");
          error.status = 404;
          throw error;
        }
        return { output_text: "Fallback transcript" };
      },
    },
  };

  const text = await transcribeWithFallback(
    client,
    { uri: "files/audio", mimeType: "audio/mpeg" },
    "primary-model",
    "fallback-model",
  );

  assert.equal(text, "Fallback transcript");
  assert.deepEqual(requestedModels, ["primary-model", "fallback-model"]);
});

test("transcription does not retry or fall back on invalid API keys", async () => {
  let attempts = 0;
  const client = {
    interactions: {
      create: async () => {
        attempts += 1;
        const error = new Error("API key not valid");
        error.status = 400;
        throw error;
      },
    },
  };

  await assert.rejects(
    transcribeWithFallback(
      client,
      { uri: "files/audio", mimeType: "audio/mpeg" },
      "primary-model",
      "fallback-model",
    ),
    /API key not valid/,
  );
  assert.equal(attempts, 1);
});

test("POST /api/transcriptions rate limits excessive requests", async () => {
  let response;

  for (let request = 0; request < 12; request += 1) {
    response = await fetch(`${baseUrl}/api/transcriptions`, {
      method: "POST",
      body: new FormData(),
    });

    if (response.status === 429) {
      break;
    }
  }

  assert.equal(response.status, 429);
  assert.match((await response.json()).error, /too many transcription requests/i);
});
