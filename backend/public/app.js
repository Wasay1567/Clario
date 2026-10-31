const form = document.querySelector("#transcription-form");
const audioInput = document.querySelector("#audio");
const imageInput = document.querySelector("#images");
const submitButton = document.querySelector("#submit");
const status = document.querySelector("#status");
const transcriptSection = document.querySelector("#transcript-section");
const result = document.querySelector("#result");
const stepProgress = document.querySelector("#step-progress");
const stepText = document.querySelector("#step-text");
const stepNavigation = document.querySelector("#step-navigation");
const previousStepButton = document.querySelector("#previous-step");
const nextStepButton = document.querySelector("#next-step");
let helpSteps = [];
let currentStepIndex = 0;

function showCurrentStep() {
  const isUrdu = /[\u0600-\u06ff]/.test(helpSteps[currentStepIndex] || "");
  stepText.lang = isUrdu ? "ur" : "en";
  stepText.dir = isUrdu ? "rtl" : "ltr";
  stepText.textContent = helpSteps[currentStepIndex];
  stepProgress.textContent = `Step ${currentStepIndex + 1} of ${helpSteps.length}`;
  previousStepButton.disabled = currentStepIndex === 0;
  nextStepButton.textContent =
    currentStepIndex === helpSteps.length - 1 ? "Start again" : "Next step";
}

previousStepButton.addEventListener("click", () => {
  if (currentStepIndex > 0) {
    currentStepIndex -= 1;
    showCurrentStep();
  }
});

nextStepButton.addEventListener("click", () => {
  if (currentStepIndex < helpSteps.length - 1) {
    currentStepIndex += 1;
    showCurrentStep();
    return;
  }

  currentStepIndex = 0;
  showCurrentStep();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const audioFile = audioInput.files[0];
  if (!audioFile) {
    status.textContent = "Choose an audio file first.";
    return;
  }

  if (audioFile.size > 25 * 1024 * 1024) {
    status.textContent = "That file is over the 25 MB limit.";
    return;
  }

  const images = Array.from(imageInput.files);
  if (images.length > 4) {
    status.textContent = "Choose up to four screenshots.";
    return;
  }

  if (images.some((image) => image.size > 8 * 1024 * 1024)) {
    status.textContent = "Each screenshot must be 8 MB or smaller.";
    return;
  }

  if (images.some((image) => !["image/png", "image/jpeg", "image/gif", "image/webp"].includes(image.type))) {
    status.textContent = "Screenshots must be PNG, JPEG, GIF, or WebP images.";
    return;
  }

  const audioBody = new FormData();
  audioBody.append("audio", audioFile);
  submitButton.disabled = true;
  transcriptSection.hidden = true;
  result.textContent = "";
  stepText.textContent = "";
  stepProgress.textContent = "";
  stepNavigation.hidden = true;
  helpSteps = [];
  currentStepIndex = 0;
  status.textContent = "Transcribing your audio...";

  try {
    const transcriptionResponse = await fetch("/api/transcriptions", {
      method: "POST",
      body: audioBody,
    });
    const transcriptionData = await transcriptionResponse.json();

    if (!transcriptionResponse.ok) {
      throw new Error(transcriptionData.error || "Transcription failed.");
    }

    if (typeof transcriptionData.text !== "string" || !transcriptionData.text.trim()) {
      throw new Error("The transcription service returned an empty transcript.");
    }

    result.textContent = transcriptionData.text;
    transcriptSection.hidden = false;
    status.textContent = "Getting step-by-step help...";

    const helpBody = new FormData();
    helpBody.append("transcription", transcriptionData.text);
    for (const image of images) {
      helpBody.append("images", image);
    }

    const helpResponse = await fetch("/api/help", {
      method: "POST",
      body: helpBody,
    });
    const helpData = await helpResponse.json();

    if (!helpResponse.ok) {
      throw new Error(helpData.error || "Could not get help for this request.");
    }

    if (
      !Array.isArray(helpData.steps) ||
      helpData.steps.length < 1 ||
      helpData.steps.some((step) => typeof step !== "string" || !step.trim())
    ) {
      throw new Error("The help service returned no valid steps.");
    }

    helpSteps = helpData.steps;
    currentStepIndex = 0;
    showCurrentStep();
    stepNavigation.hidden = helpSteps.length === 1;
    status.textContent = "Your step-by-step help is ready.";
  } catch (error) {
    status.textContent =
      error instanceof Error
        ? error.message
        : "Could not reach the transcription server.";
  } finally {
    submitButton.disabled = false;
  }
});
