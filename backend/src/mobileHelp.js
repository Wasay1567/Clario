function getHelpInstructions(transcription) {
  const responseLanguage = shouldRespondInUrdu(transcription)
    ? "Urdu, written in Urdu script. This includes Hindi text written in Devanagari, since this user wants Urdu answers. Do not answer in Hindi or English."
    : "English. answer in English.";

  return `You are a patient mobile-phone helper for older adults. Give practical instructions for the exact phone task the person asks about.

RESPONSE LANGUAGE: ${responseLanguage}

Follow the person's actual request. Do not replace it with a different task or give unrelated advice. If they clearly ask how to do something, give the steps instead of asking them to repeat the request. Ask one brief clarifying question only if their goal itself is genuinely unclear.

Return only a JSON object with a "steps" array containing between one and five short strings. Each string must describe one clear action, in the response language specified above. Keep the steps simple and suitable for an older adult. Do not include an introduction, conclusion, markdown, or numbered prefixes; the frontend displays one array item at a time.

Use any supplied images only as context about the screen. Describe buttons by their visible label or position only when that is clear from an image. Do not claim to see details that are not visible. Never ask the person to share passwords, PINs, OTPs, or payment details, and do not instruct them to bypass security or make a payment.`;
}

function shouldRespondInUrdu(text) {
  if (/[\u0600-\u06ff\u0900-\u097f]/.test(text)) {
    return true;
  }

  return /\b(mujhe|mujhay|mera|meri|mere|mujh|kaise|kaisa|karna|karo|karen|hai|hain|kya|batao|bataye|chahiye|nahin|nahi|madad|urdu)\b/i.test(
    text,
  );
}

export async function generateMobileHelp(client, transcription, images, model) {
  const parts = [{ text: `The person's request:\n${transcription}` }];

  for (const image of images) {
    parts.push({
      inlineData: {
        mimeType: image.mimetype,
        data: image.buffer.toString("base64"),
      },
    });
  }

  const response = await client.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: getHelpInstructions(transcription),
      responseMimeType: "application/json",
      maxOutputTokens: 1400,
      temperature: 0.2,
    },
  });

  if (typeof response.text !== "string" || !response.text.trim()) {
    throw new Error("Gemini returned no mobile-help steps.");
  }

  let result;
  try {
    result = JSON.parse(response.text);
  } catch (error) {
    throw new Error("Gemini returned invalid JSON for mobile-help steps.", {
      cause: error,
    });
  }

  if (
    !result ||
    !Array.isArray(result.steps) ||
    result.steps.length < 1 ||
    result.steps.length > 5 ||
    result.steps.some(
      (step) => typeof step !== "string" || !step.trim() || step.length > 500,
    )
  ) {
    throw new Error("Gemini returned an invalid mobile-help steps list.");
  }

  const steps = result.steps.map((step) => step.trim());
  const expectsUrdu = shouldRespondInUrdu(transcription);
  const hasWrongLanguage = steps.some((step) =>
    expectsUrdu
      ? !/[\u0600-\u06ff]/.test(step)
      : /[\u0600-\u06ff]/.test(step),
  );

  if (hasWrongLanguage) {
    const error = new Error("Gemini returned steps in the wrong language.");
    error.status = 422;
    throw error;
  }

  return { steps };
}
