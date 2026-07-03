const imageInput = document.querySelector("#imageInput");
const dropZone = document.querySelector("#dropZone");
const previewWrap = document.querySelector("#previewWrap");
const previewImage = document.querySelector("#previewImage");
const analyzeBtn = document.querySelector("#analyzeBtn");
const clearBtn = document.querySelector("#clearBtn");
const resultState = document.querySelector("#resultState");
const resultCard = document.querySelector("#resultCard");
const emotionName = document.querySelector("#emotionName");
const confidenceText = document.querySelector("#confidenceText");
const confidenceBar = document.querySelector("#confidenceBar");
const scoresList = document.querySelector("#scoresList");

// API using to UI
// const FASTAPI_ENDPOINT = "http://127.0.0.1:8000/emotion/predict";

const FASTAPI_ENDPOINT = "https://chhaylenggg-face-emotion.hf.space/emotion/predict";

let selectedFile = null;

function setFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    showMessage("Please upload a valid image file.");
    return;
  }

  selectedFile = file;
  previewImage.src = URL.createObjectURL(file);
  previewWrap.classList.remove("is-empty");
  analyzeBtn.disabled = false;
  resetResult("Image loaded. Click analyze to detect emotion.");
}

function resetResult(message = "Upload an image to start analysis.") {
  resultCard.classList.add("hidden");
  scoresList.classList.add("hidden");
  resultState.classList.remove("hidden", "is-loading");
  resultState.querySelector("p").textContent = message;
  confidenceBar.style.width = "0%";
  emotionName.textContent = "";
  confidenceText.textContent = "0%";
}

function showMessage(message) {
  resetResult(message);
}

function clearAll() {
  selectedFile = null;
  imageInput.value = "";
  previewImage.removeAttribute("src");
  previewWrap.classList.add("is-empty");
  analyzeBtn.disabled = true;
  resetResult();
}

function renderScores(scores) {
  scoresList.innerHTML = "";

  scores.forEach((item) => {
    const row = document.createElement("div");
    row.className = "score-item";

    row.innerHTML = `
      <span>${item.emotion}</span>
      <div class="score-track">
        <span style="width: ${item.score}%"></span>
      </div>
      <strong>${item.score}%</strong>
    `;

    scoresList.appendChild(row);
  });
}

async function analyzeImage() {
  if (!selectedFile) {
    showMessage("Upload an image first.");
    return;
  }

  resultCard.classList.add("hidden");
  scoresList.classList.add("hidden");
  resultState.classList.remove("hidden");
  resultState.classList.add("is-loading");
  resultState.querySelector("p").textContent = "Analyzing facial expression...";
  analyzeBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await fetch(FASTAPI_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    console.log("API response:", data);

    if (!response.ok) {
      throw new Error(data.detail || `API error: ${response.status}`);
    }

    if (!data.faces || data.faces.length === 0) {
      showMessage("No face detected. Please upload a clearer face image.");
      return;
    }

    const face = data.faces[0];

    const prediction = {
      emotion: face.emotion || "Unknown",
      confidence: Math.round(Number(face.emotion_confidence || 0)),
      scores: (face.all_scores || []).map((item) => ({
        emotion: item.label,
        score: Math.round(Number(item.confidence || 0)),
      })),
    };

    emotionName.textContent = prediction.emotion;
    confidenceText.textContent = `${prediction.confidence}%`;
    confidenceBar.style.width = `${prediction.confidence}%`;

    renderScores(prediction.scores);

    resultState.classList.add("hidden");
    resultState.classList.remove("is-loading");
    resultCard.classList.remove("hidden");
    scoresList.classList.remove("hidden");
  } catch (error) {
    console.error("Fetch error:", error);
    showMessage("API connection failed. Check FastAPI CORS and endpoint URL.");
  } finally {
    analyzeBtn.disabled = false;
  }
}

imageInput.addEventListener("change", (event) => {
  setFile(event.target.files[0]);
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("is-dragging");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  setFile(event.dataTransfer.files[0]);
});

analyzeBtn.addEventListener("click", analyzeImage);
clearBtn.addEventListener("click", clearAll);