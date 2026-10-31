const retryableStatuses = new Set([408, 429, 500, 502, 503, 504]);
const maxAttempts = 3;
const initialRetryDelayMs = 500;

export async function retryProviderRequest(operation, description) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts || !isRetryable(error)) {
        throw error;
      }

      const delay = initialRetryDelayMs * 2 ** (attempt - 1);
      console.warn(
        `${description} failed (attempt ${attempt}/${maxAttempts}); retrying in ${delay}ms.`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`${description} failed after retries.`);
}

export async function transcribeWithFallback(
  client,
  audioFile,
  primaryModel,
  fallbackModel,
) {
  const models = [...new Set([primaryModel, fallbackModel].filter(Boolean))];
  let lastError;

  for (const [index, model] of models.entries()) {
    try {
      const transcription = await retryProviderRequest(
        () =>
          client.interactions.create({
            model,
            input:
              index === 0
                ? [
                    {
                      type: "audio",
                      uri: audioFile.uri,
                      mime_type: audioFile.mimeType,
                    },
                  ]
                : [
                    {
                      type: "text",
                      text: "Transcribe the spoken words in this audio accurately. Return only the transcript.",
                    },
                    {
                      type: "audio",
                      uri: audioFile.uri,
                      mime_type: audioFile.mimeType,
                    },
                  ],
          }),
        `Transcription with ${model}`,
      );

      if (!transcription.output_text) {
        throw new Error(`The ${model} model returned no transcript.`);
      }

      return transcription.output_text;
    } catch (error) {
      lastError = error;
      if (isAuthenticationError(error) || index === models.length - 1) {
        throw error;
      }

      console.warn(`Transcription with ${model} failed; trying ${models[index + 1]}.`);
    }
  }

  throw lastError ?? new Error("No transcription models are configured.");
}

function isRetryable(error) {
  if (isAuthenticationError(error)) {
    return false;
  }

  const status = Number(error?.status);
  return !Number.isFinite(status) || retryableStatuses.has(status);
}

function isAuthenticationError(error) {
  return (
    error?.status === 401 ||
    error?.status === 403 ||
    /API_KEY_INVALID|API key not valid|invalid api key/i.test(error?.message ?? "")
  );
}
