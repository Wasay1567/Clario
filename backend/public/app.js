const form = document.querySelector("#transcription-form");
const audioInput = document.querySelector("#audio");
const submitButton = document.querySelector("#submit");
const status = document.querySelector("#status");
const transcriptSection = document.querySelector("#transcript-section");
const result = document.querySelector("#result");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = audioInput.files[0];
  if (!file) {
    status.textContent = "Choose an audio file first.";
    return;
  }

  if (file.size > 25 * 1024 * 1024) {
    status.textContent = "That file is over the 25 MB limit.";
    return;
  }

  const body = new FormData();
  body.append("audio", file);
  submitButton.disabled = true;
  transcriptSection.hidden = true;
  result.textContent = "";
  status.textContent = "Transcribing audio. This may take a little while...";

  try {
    const response = await fetch("/api/transcriptions", {
      method: "POST",
      body,
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Transcription failed.");
    }

    if (typeof data.text !== "string" || !data.text.trim()) {
      throw new Error("The transcription service returned an empty transcript.");
    }

    result.textContent = data.text;
    transcriptSection.hidden = false;
    status.textContent = "Transcription complete.";
  } catch (error) {
    status.textContent =
      error instanceof Error
        ? error.message
        : "Could not reach the transcription server.";
  } finally {
    submitButton.disabled = false;
  }
});
