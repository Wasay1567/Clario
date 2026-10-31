import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import app from "../src/app.js";
import { generateMobileHelp } from "../src/mobileHelp.js";
import {
  retryProviderRequest,
  transcribeWithFallback,
} from "../src/transcription.js";

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

test("GET / serves the mobile-help page with multi-image upload", async () => {
  const response = await fetch(`${baseUrl}/`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  const page = await response.text();
  assert.match(page, /Mobile help/);
  assert.match(page, /id="images"[\s\S]*?multiple/);
  assert.match(page, /<script src="\/app\.js" defer><\/script>/);
  assert.doesNotMatch(page, /<script>[\s\S]*?<\/script>/);
});

test("GET /app.js serves the browser transcription handler", async () => {
  const response = await fetch(`${baseUrl}/app.js`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /javascript/);
  const script = await response.text();
  assert.match(script, /fetch\("\/api\/transcriptions"/);
  assert.match(script, /fetch\("\/api\/help"/);
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

test("POST /api/assist requires an audio file", async () => {
  const response = await fetch(`${baseUrl}/api/assist`, {
    method: "POST",
    body: new FormData(),
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /audio file is required/i);
});

test("POST /api/assist rejects an image uploaded in the audio field", async () => {
  const form = new FormData();
  form.append("audio", new Blob(["image"], { type: "image/png" }), "screen.png");

  const response = await fetch(`${baseUrl}/api/assist`, {
    method: "POST",
    body: form,
  });

  assert.equal(response.status, 415);
  assert.match((await response.json()).error, /audio field must contain/i);
});

test("POST /api/assist accepts recorded audio and multiple images before checking configuration", async () => {
  const originalApiKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const form = new FormData();
    form.append(
      "audio",
      new Blob(["audio"], { type: "audio/webm;codecs=opus" }),
      "voice.webm",
    );
    form.append("images", new Blob(["first"], { type: "image/png" }), "screen-1.png");
    form.append("images", new Blob(["second"], { type: "image/jpeg" }), "screen-2.jpg");

    const response = await fetch(`${baseUrl}/api/assist`, {
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

test("POST /api/help requires a transcription", async () => {
  const response = await fetch(`${baseUrl}/api/help`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /provide a transcription/i);
});

test("POST /api/help reports when Gemini is not configured", async () => {
  const originalApiKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const form = new FormData();
    form.append("transcription", "I cannot save a contact.");
    form.append("images", new Blob(["first"], { type: "image/png" }), "screen-1.png");
    form.append("images", new Blob(["second"], { type: "image/jpeg" }), "screen-2.jpg");

    const response = await fetch(`${baseUrl}/api/help`, {
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

test("POST /api/help rejects unsupported image types", async () => {
  const form = new FormData();
  form.append("transcription", "I cannot save a contact.");
  form.append("images", new Blob(["not an image"], { type: "text/plain" }), "notes.txt");

  const response = await fetch(`${baseUrl}/api/help`, {
    method: "POST",
    body: form,
  });

  assert.equal(response.status, 415);
  assert.match((await response.json()).error, /unsupported image type/i);
});

test("mobile help sends the transcription and multiple images to Gemini", async () => {
  let request;
  const client = {
    models: {
      generateContent: async (params) => {
        request = params;
        return {
          text: JSON.stringify({
            steps: ["Open Contacts.", "Enter the name and number."],
          }),
        };
      },
    },
  };
  const images = [
    { mimetype: "image/png", buffer: Buffer.from("first-image") },
    { mimetype: "image/jpeg", buffer: Buffer.from("second-image") },
  ];

  const help = await generateMobileHelp(
    client,
    "I cannot save a contact.",
    images,
    "test-model",
  );

  assert.deepEqual(help, {
    steps: ["Open Contacts.", "Enter the name and number."],
  });
  assert.equal(request.model, "test-model");
  assert.match(request.config.systemInstruction, /RESPONSE LANGUAGE: English/i);
  assert.match(request.contents[0].parts[0].text, /I cannot save a contact\./);
  assert.equal(request.config.responseMimeType, "application/json");
  assert.equal(request.config.maxOutputTokens, 1400);
  assert.deepEqual(
    request.contents[0].parts.slice(1).map((part) => part.inlineData),
    images.map((image) => ({
      mimeType: image.mimetype,
      data: image.buffer.toString("base64"),
    })),
  );
});

test("mobile help requests Urdu-script steps for Urdu transcriptions", async () => {
  let request;
  const client = {
    models: {
      generateContent: async (params) => {
        request = params;
        return { text: JSON.stringify({ steps: ["رابطے کھولیں۔"] }) };
      },
    },
  };

  const help = await generateMobileHelp(
    client,
    "مجھے نیا رابطہ محفوظ کرنے کا طریقہ بتائیں۔",
    [],
    "test-model",
  );

  assert.deepEqual(help, { steps: ["رابطے کھولیں۔"] });
  assert.match(
    request.config.systemInstruction,
    /RESPONSE LANGUAGE: Urdu, written in Urdu script/i,
  );
});

test("mobile help requests Urdu-script steps for Hindi Devanagari transcriptions", async () => {
  let request;
  const client = {
    models: {
      generateContent: async (params) => {
        request = params;
        return { text: JSON.stringify({ steps: ["رابطے کھولیں۔"] }) };
      },
    },
  };

  const help = await generateMobileHelp(
    client,
    "मुझे नया संपर्क सहेजने का तरीका बताएं।",
    [],
    "test-model",
  );

  assert.deepEqual(help, { steps: ["رابطے کھولیں۔"] });
  assert.match(
    request.config.systemInstruction,
    /Hindi text written in Devanagari.*user wants Urdu answers/i,
  );
});

test("mobile help requests Urdu-script steps for Roman Urdu transcriptions", async () => {
  let request;
  const client = {
    models: {
      generateContent: async (params) => {
        request = params;
        return { text: JSON.stringify({ steps: ["رابطے کھولیں۔"] }) };
      },
    },
  };

  await generateMobileHelp(
    client,
    "Mujhe naya contact save karna hai.",
    [],
    "test-model",
  );

  assert.match(
    request.config.systemInstruction,
    /RESPONSE LANGUAGE: Urdu, written in Urdu script/i,
  );
});

test("mobile help rejects invalid Gemini step responses", async () => {
  const client = {
    models: {
      generateContent: async () => ({ text: JSON.stringify({ steps: [] }) }),
    },
  };

  await assert.rejects(
    generateMobileHelp(client, "I need help.", [], "test-model"),
    /invalid mobile-help steps list/i,
  );
});

test("mobile help rejects steps Gemini returns in the wrong language", async () => {
  const client = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({ steps: ["Could you repeat your question?"] }),
      }),
    },
  };

  await assert.rejects(
    generateMobileHelp(
      client,
      "مجھے نیا رابطہ محفوظ کرنے کا طریقہ بتائیں۔",
      [],
      "test-model",
    ),
    /steps in the wrong language/i,
  );
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

test("provider retries do not repeat quota-exhausted requests", async () => {
  let attempts = 0;
  const error = new Error(
    "RESOURCE_EXHAUSTED: Generate content requests per day limit exceeded.",
  );
  error.status = 429;

  await assert.rejects(
    retryProviderRequest(async () => {
      attempts += 1;
      throw error;
    }, "Mobile help generation"),
    /RESOURCE_EXHAUSTED/,
  );

  assert.equal(attempts, 1);
});

test("transcription asks Gemini to preserve the spoken language and Urdu script", async () => {
  const requests = [];
  const client = {
    interactions: {
      create: async (request) => {
        requests.push(request);
        return { output_text: "مجھے مدد چاہیے۔" };
      },
    },
  };

  await transcribeWithFallback(
    client,
    { uri: "files/audio", mimeType: "audio/mpeg" },
    "primary-model",
    "fallback-model",
  );

  assert.deepEqual(requests[0].input.map((part) => part.type), ["text", "audio"]);
  assert.match(requests[0].input[0].text, /do not translate it/i);
  assert.match(requests[0].input[0].text, /Urdu script, not Hindi or Devanagari/i);
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
