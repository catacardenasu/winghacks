import { getCategoryEntries, getRandomMolecule } from "./data/moleculeDatabase.js";
import { GameEngine } from "./engine/gameEngine.js";
import { TimerEngine } from "./engine/timerEngine.js";
import { DrawingEngine } from "./engine/drawingEngine.js";
import { MultiplayerEngine } from "./engine/multiplayerEngine.js";
import { addToReview, getReviewList, removeFromReview } from "./engine/reviewEngine.js";

const ROUND_SECONDS = 90;
const ANALYZE_DELAY_MS = 1500;

const homeScreen = document.getElementById("home-screen");
const gameScreen = document.getElementById("game-screen");
const resultsScreen = document.getElementById("results-screen");
const reviewScreen = document.getElementById("review-screen");

const categorySelect = document.getElementById("category-select");
const roundCountSelect = document.getElementById("round-count-select");
const playerNameInput = document.getElementById("player-name");
const roomCodeInput = document.getElementById("room-code-input");
const roomStatus = document.getElementById("room-status");
const multiplayerPanel = document.getElementById("multiplayer-panel");

const soloModeBtn = document.getElementById("solo-mode-btn");
const multiplayerModeBtn = document.getElementById("multiplayer-mode-btn");
const canvasModeBtn = document.getElementById("canvas-mode-btn");
const whiteboardModeBtn = document.getElementById("whiteboard-mode-btn");
const createRoomBtn = document.getElementById("create-room-btn");
const joinRoomBtn = document.getElementById("join-room-btn");
const startBtn = document.getElementById("start-btn");
const reviewBtn = document.getElementById("review-btn");
const reviewBackBtn = document.getElementById("review-back-btn");
const nextRoundBtn = document.getElementById("next-round-btn");
const playAgainBtn = document.getElementById("play-again-btn");
const clearBtn = document.getElementById("clear-btn");
const submitBtn = document.getElementById("submit-btn");
const addReviewBtn = document.getElementById("add-review-btn");

const roundLabel = document.getElementById("round-label");
const moleculeName = document.getElementById("molecule-name");
const moleculeFormula = document.getElementById("molecule-formula");
const timerEl = document.getElementById("timer");
const roomBadge = document.getElementById("room-badge");
const totalScoreHud = document.getElementById("total-score-hud");
const xpHud = document.getElementById("xp-hud");
const streakIndicator = document.getElementById("streak-indicator");
const statusMessage = document.getElementById("status-message");
const energyWrap = document.getElementById("energy-wrap");
const energyBar = document.getElementById("energy-bar");
const analyzingOverlay = document.getElementById("analyzing-overlay");
const overlayMessage = document.getElementById("overlay-message");
const waitingProgress = document.getElementById("waiting-progress");
const canvas = document.getElementById("draw-canvas");
const whiteboardVideo = document.getElementById("whiteboard-video");

const resultsTitle = document.getElementById("results-title");
const resultMolecule = document.getElementById("result-molecule");
const resultRoom = document.getElementById("result-room");
const resultPreview = document.getElementById("result-preview");
const referencePreview = document.getElementById("reference-preview");
const referenceFallback = document.getElementById("reference-fallback");
const resultPlayerName = document.getElementById("result-player-name");
const resultPlayerScore = document.getElementById("result-player-score");
const resultOpponentRow = document.getElementById("result-opponent-row");
const resultOpponentName = document.getElementById("result-opponent-name");
const resultOpponentScore = document.getElementById("result-opponent-score");
const roundFeedback = document.getElementById("round-feedback");
const resultScoreNote = document.getElementById("result-score-note");
const resultTotals = document.getElementById("result-totals");
const resultStreak = document.getElementById("result-streak");
const soloEncouragement = document.getElementById("solo-encouragement");
const finalOutcome = document.getElementById("final-outcome");

const reviewList = document.getElementById("review-list");

const gameEngine = new GameEngine(5);
const multiplayerEngine = new MultiplayerEngine();
const drawingEngine = new DrawingEngine(canvas);

const session = {
  mode: "solo",
  drawingMode: "canvas",
  roomCode: "",
  localPlayerId: "",
  localPlayerName: "Player 1",
  categoryKey: "",
  selectedRoundCount: 5,
  practiceTarget: null,
  webcamStream: null,
};

const roundState = {
  isResolving: false,
  opponentPlan: null,
  opponentFinishedShown: false,
  roundStartMs: 0,
  lastRoundResult: null,
  attempts: {},
};

const timerEngine = new TimerEngine(
  ROUND_SECONDS,
  (secondsLeft) => onTick(secondsLeft),
  () => finalizeRound("timeout")
);

function showScreen(screenId) {
  homeScreen.classList.remove("active");
  gameScreen.classList.remove("active");
  resultsScreen.classList.remove("active");
  reviewScreen.classList.remove("active");

  if (screenId === "home") homeScreen.classList.add("active");
  if (screenId === "game") gameScreen.classList.add("active");
  if (screenId === "results") resultsScreen.classList.add("active");
  if (screenId === "review") reviewScreen.classList.add("active");
}

function getPlayerName() {
  const value = playerNameInput.value.trim();
  return value || "Player 1";
}

function setMode(mode) {
  session.mode = mode;
  soloModeBtn.classList.toggle("active", mode === "solo");
  multiplayerModeBtn.classList.toggle("active", mode === "multiplayer");
  multiplayerPanel.classList.toggle("collapsed", mode !== "multiplayer");

  if (mode === "solo") {
    session.roomCode = "";
    session.localPlayerId = "";
    roomBadge.textContent = "Mode: Solo";
  }

  updateRoomStatus("No room selected. Create or join one.");
}

function setDrawingMode(mode) {
  session.drawingMode = mode;
  canvasModeBtn.classList.toggle("active", mode === "canvas");
  whiteboardModeBtn.classList.toggle("active", mode === "whiteboard");

  if (mode === "canvas") {
    stopWebcamStream();
  }
}

function populateCategoryDropdown() {
  const categories = getCategoryEntries();
  categorySelect.innerHTML = "";

  categories.forEach((category, index) => {
    const option = document.createElement("option");
    option.value = category.key;
    option.textContent = category.label;
    if (index === 0) option.selected = true;
    categorySelect.appendChild(option);
  });
}

function updateRoomStatus(message) {
  if (session.mode === "solo") {
    roomStatus.textContent = "Solo mode active.";
    roomBadge.textContent = "Mode: Solo";
    return;
  }

  roomStatus.textContent = message;
  roomBadge.textContent = `Room: ${session.roomCode || "------"}`;
}

function updateHud() {
  roundLabel.textContent = `Round ${gameEngine.currentRound} of ${gameEngine.totalRounds}`;
  totalScoreHud.textContent = `Total: ${gameEngine.totalScore}`;
  xpHud.textContent = `XP: ${gameEngine.totalXp}`;

  const multiplier = gameEngine.getMultiplierForStreak(gameEngine.streak);
  streakIndicator.textContent = `Streak x${multiplier}`;
}

function updateReviewButton() {
  reviewBtn.textContent = `Review Missed (${getReviewList().length})`;
}

function setStatusMessage(message, critical = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("critical", critical);
}

function setRoundInteractionEnabled(isEnabled) {
  drawingEngine.setEnabled(isEnabled);
  clearBtn.disabled = !isEnabled || session.drawingMode !== "canvas";
  submitBtn.disabled = !isEnabled;
}

function createRoom() {
  const playerName = getPlayerName();
  const result = multiplayerEngine.createRoom(playerName);

  session.roomCode = result.roomCode;
  session.localPlayerId = result.localPlayer.id;
  session.localPlayerName = result.localPlayer.name;

  updateRoomStatus(`Room ${session.roomCode} created as ${session.localPlayerName}.`);
}

function joinRoom() {
  const roomCode = roomCodeInput.value;
  const playerName = getPlayerName();

  try {
    const result = multiplayerEngine.joinRoom(roomCode, playerName);

    session.roomCode = result.roomCode;
    session.localPlayerId = result.localPlayer.id;
    session.localPlayerName = result.localPlayer.name;

    updateRoomStatus(`Joined room ${session.roomCode} as ${session.localPlayerName}.`);
  } catch (error) {
    updateRoomStatus(error.message);
  }
}

function ensureRoom() {
  session.localPlayerName = getPlayerName();

  if (session.mode === "solo") {
    session.roomCode = "SOLO";
    session.localPlayerId = "solo-player";
    return;
  }

  if (session.roomCode && session.localPlayerId) return;
  createRoom();
}

function getSoloEncouragement(score, streak) {
  if (score >= 90) return "Excellent work. Your structure clarity is improving fast.";
  if (streak >= 2) return "Strong momentum. Keep practicing this concept.";
  return "Nice progress. Compare with the reference and try again.";
}

async function startMatch() {
  ensureRoom();

  session.selectedRoundCount = Number(roundCountSelect.value);
  session.categoryKey = session.practiceTarget?.categoryKey || categorySelect.value;

  gameEngine.startSession(session.categoryKey, session.selectedRoundCount);

  if (session.mode === "multiplayer") {
    multiplayerEngine.ensureMockOpponent(session.roomCode, session.localPlayerId);
    multiplayerEngine.resetRoomScores(session.roomCode);
  }

  await startNextRound();
}

async function startNextRound() {
  const molecule = session.practiceTarget || getRandomMolecule(session.categoryKey);
  session.practiceTarget = null;

  if (!molecule) {
    updateRoomStatus("No molecules found for the selected category.");
    return;
  }

  const round = gameEngine.beginRound(molecule);
  roundState.opponentPlan = session.mode === "multiplayer"
    ? multiplayerEngine.simulateOpponentRound(session.roomCode, session.localPlayerId)
    : null;
  roundState.opponentFinishedShown = false;
  roundState.isResolving = false;
  roundState.roundStartMs = Date.now();
  roundState.lastRoundResult = null;

  moleculeName.textContent = round.molecule.name;
  moleculeFormula.textContent = `Formula: ${round.molecule.formula}`;
  updateHud();

  const modeReady = await initializeDrawingSurface();
  if (!modeReady) return;

  setRoundInteractionEnabled(true);

  if (session.mode === "solo") {
    setStatusMessage("Sketch your best structure.");
  } else {
    setStatusMessage("Draw and submit before your rival.");
  }

  energyWrap.classList.remove("low");
  timerEl.classList.remove("urgent");
  gameScreen.classList.remove("lab-flash");
  updateEnergy(ROUND_SECONDS);

  hideOverlay();
  timerEngine.start();
  showScreen("game");
}

async function initializeDrawingSurface() {
  if (session.drawingMode === "whiteboard") {
    const ready = await startWebcamStream();
    if (!ready) {
      setDrawingMode("canvas");
      setStatusMessage("Webcam unavailable. Switched to Canvas Mode.", true);
      return initializeDrawingSurface();
    }

    canvas.classList.add("hidden");
    whiteboardVideo.classList.remove("hidden");
    clearBtn.classList.add("hidden");
    submitBtn.textContent = "Capture & Submit";
    return true;
  }

  stopWebcamStream();
  drawingEngine.clear();
  canvas.classList.remove("hidden");
  whiteboardVideo.classList.add("hidden");
  clearBtn.classList.remove("hidden");
  submitBtn.textContent = "Submit Drawing";
  return true;
}

async function startWebcamStream() {
  try {
    stopWebcamStream();

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    session.webcamStream = stream;
    whiteboardVideo.srcObject = stream;
    await whiteboardVideo.play();
    return true;
  } catch {
    updateRoomStatus("Webcam access denied or unavailable.");
    return false;
  }
}

function stopWebcamStream() {
  if (!session.webcamStream) return;

  session.webcamStream.getTracks().forEach((track) => track.stop());
  session.webcamStream = null;
  whiteboardVideo.srcObject = null;
}

function captureWhiteboardFrame() {
  const frameCanvas = document.createElement("canvas");
  frameCanvas.width = whiteboardVideo.videoWidth || 960;
  frameCanvas.height = whiteboardVideo.videoHeight || 540;

  const ctx = frameCanvas.getContext("2d");
  ctx.drawImage(whiteboardVideo, 0, 0, frameCanvas.width, frameCanvas.height);

  return frameCanvas.toDataURL("image/png");
}

function updateEnergy(secondsLeft) {
  const percent = Math.max(0, (secondsLeft / ROUND_SECONDS) * 100);
  energyBar.style.width = `${percent}%`;

  if (secondsLeft <= 20) {
    energyWrap.classList.add("low");
  }

  timerEl.classList.toggle("urgent", secondsLeft <= 10);
}

function onTick(secondsLeft) {
  timerEl.textContent = `${secondsLeft}s`;
  updateEnergy(secondsLeft);

  if (session.mode !== "multiplayer") {
    if (secondsLeft <= 10) {
      setStatusMessage("Finalize and submit your structure.", true);
    }
    return;
  }

  const elapsed = Math.floor((Date.now() - roundState.roundStartMs) / 1000);
  if (!roundState.opponentFinishedShown && roundState.opponentPlan && elapsed >= roundState.opponentPlan.finishTimeSec) {
    roundState.opponentFinishedShown = true;
    setStatusMessage("Opponent finished!", false);
  }

  if (secondsLeft <= 12 && !roundState.opponentFinishedShown) {
    setStatusMessage("Lab stability dropping fast.", true);
  }
}

function showOverlay(isWaiting = false) {
  overlayMessage.innerHTML = isWaiting
    ? "Waiting for opponent..."
    : "Analyzing Structure<span class=\"dot-flow\"><span>.</span><span>.</span><span>.</span></span>";

  waitingProgress.hidden = !isWaiting;
  analyzingOverlay.classList.add("show");
  analyzingOverlay.setAttribute("aria-hidden", "false");
}

function hideOverlay() {
  waitingProgress.hidden = true;
  analyzingOverlay.classList.remove("show");
  analyzingOverlay.setAttribute("aria-hidden", "true");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function animateValue(element, to, duration = 750) {
  const from = Number(element.textContent) || 0;
  const start = performance.now();

  function step(now) {
    const progress = Math.min(1, (now - start) / duration);
    const value = Math.round(from + (to - from) * progress);
    element.textContent = `${value}`;
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

async function finalizeRound(reason) {
  if (roundState.isResolving) return;
  roundState.isResolving = true;

  timerEngine.stop();
  setRoundInteractionEnabled(false);

  if (reason === "timeout") {
    setStatusMessage(session.mode === "solo" ? "Round complete." : "Lab Unstable!", true);
    gameScreen.classList.add("lab-flash");
  }

  const drawingDataUrl = session.drawingMode === "whiteboard"
    ? captureWhiteboardFrame()
    : drawingEngine.captureDataUrl();

  stopWebcamStream();

  showOverlay(false);
  await delay(ANALYZE_DELAY_MS);

  const roundResult = gameEngine.finishRound(drawingDataUrl);
  roundState.lastRoundResult = roundResult;

  const key = roundResult.molecule.name;
  roundState.attempts[key] = Number(roundState.attempts[key] || 0) + 1;

  const elapsedSeconds = Math.floor((Date.now() - roundState.roundStartMs) / 1000);

  let scoreboard;
  if (session.mode === "multiplayer") {
    const waitMs = Math.max(0, (roundState.opponentPlan.finishTimeSec - elapsedSeconds) * 1000);
    if (waitMs > 0) {
      setStatusMessage("Waiting for opponent...", false);
      showOverlay(true);
      await delay(waitMs);
    }

    const opponentRoundScore = multiplayerEngine.generateOpponentRoundScore(
      roundResult.roundScore,
      roundState.opponentPlan
    );

    scoreboard = multiplayerEngine.submitRoundScore(
      session.roomCode,
      session.localPlayerId,
      roundResult.roundScore,
      opponentRoundScore
    );
  } else {
    scoreboard = {
      roomCode: "SOLO",
      localPlayer: { name: session.localPlayerName, score: roundResult.totalScore },
      opponent: null,
    };
  }

  hideOverlay();
  renderRoundResults(roundResult, scoreboard);
  showScreen("results");
}

function renderReference(molecule) {
  const fallbackText = `Formula reference: ${molecule.formula}`;

  referenceFallback.hidden = true;
  referencePreview.style.display = "block";

  if (!molecule.referenceImage) {
    referencePreview.style.display = "none";
    referenceFallback.hidden = false;
    referenceFallback.textContent = fallbackText;
    return;
  }

  referencePreview.onload = () => {
    referencePreview.style.display = "block";
    referenceFallback.hidden = true;
  };

  referencePreview.onerror = () => {
    referencePreview.style.display = "none";
    referenceFallback.hidden = false;
    referenceFallback.textContent = fallbackText;
  };

  referencePreview.src = molecule.referenceImage;
}

function renderRoundResults(roundResult, scoreboard) {
  const roundWord = `Round ${roundResult.roundNumber} of ${roundResult.totalRounds}`;
  resultsTitle.textContent = roundResult.isFinalRound ? "Final Results" : "Round Results";
  resultMolecule.textContent = `${roundWord} | ${roundResult.molecule.name} (${roundResult.molecule.formula})`;
  resultRoom.textContent = session.mode === "multiplayer" ? `Room: ${scoreboard.roomCode}` : "Mode: Solo";

  resultPlayerName.textContent = scoreboard.localPlayer.name;
  animateValue(resultPlayerScore, scoreboard.localPlayer.score, 850);

  addReviewBtn.disabled = false;
  addReviewBtn.textContent = "Add to Review Folder";

  resultScoreNote.textContent = `Round score: ${roundResult.roundScore} | XP earned: ${roundResult.xpEarned}`;
  resultTotals.textContent = `Total score: ${roundResult.totalScore} | Total XP: ${roundResult.totalXp}`;
  resultStreak.textContent = `Streak: ${roundResult.streak}`;
  roundFeedback.textContent = roundResult.feedbackText;

  if (roundResult.streak > 0) {
    streakIndicator.classList.remove("boost");
    void streakIndicator.offsetWidth;
    streakIndicator.classList.add("boost");
  }

  if (session.mode === "multiplayer" && scoreboard.opponent) {
    resultOpponentRow.style.display = "flex";
    resultOpponentName.textContent = scoreboard.opponent.name;
    animateValue(resultOpponentScore, scoreboard.opponent.score, 850);
    soloEncouragement.textContent = "";

    if (roundResult.isFinalRound) {
      const diff = scoreboard.localPlayer.score - scoreboard.opponent.score;
      if (diff > 0) finalOutcome.textContent = `Match win by ${diff} points.`;
      else if (diff < 0) finalOutcome.textContent = `Opponent wins by ${Math.abs(diff)} points.`;
      else finalOutcome.textContent = "Draw match. Perfect rivalry.";
    } else {
      finalOutcome.textContent = "";
    }
  } else {
    resultOpponentRow.style.display = "none";
    finalOutcome.textContent = "";
    soloEncouragement.textContent = getSoloEncouragement(roundResult.roundScore, roundResult.streak);
  }

  if (roundResult.isFinalRound) {
    nextRoundBtn.style.display = "none";
    playAgainBtn.textContent = "Play New Match";
  } else {
    nextRoundBtn.style.display = "inline-flex";
    playAgainBtn.textContent = "End Match";
  }

  resultPreview.src = roundResult.drawingDataUrl;
  resultPreview.style.display = "block";
  renderReference(roundResult.molecule);
}

function addCurrentRoundToReview() {
  const result = roundState.lastRoundResult;
  if (!result) return;

  addToReview({
    name: result.molecule.name,
    formula: result.molecule.formula,
    category: result.molecule.category,
    categoryKey: session.categoryKey,
    referenceImage: result.molecule.referenceImage,
    lastScore: result.roundScore,
    attempts: roundState.attempts[result.molecule.name] || 1,
  });

  addReviewBtn.disabled = true;
  addReviewBtn.textContent = "Added to Review";
  updateReviewButton();
}

function renderReviewList() {
  const items = getReviewList();

  if (items.length === 0) {
    reviewList.innerHTML = "<p class='result-note'>No molecules in review yet.</p>";
    return;
  }

  reviewList.innerHTML = items
    .map(
      (item) => `
        <article class="review-item">
          <h3>${item.name} (${item.formula})</h3>
          <p class="review-meta">Last score: ${item.lastScore} | Attempts: ${item.attempts}</p>
          <div class="controls controls-start gap-sm wrap">
            <button class="btn btn-primary review-practice" data-name="${item.name}">Practice Again</button>
            <button class="btn btn-secondary review-remove" data-name="${item.name}">Remove from Review</button>
          </div>
        </article>
      `
    )
    .join("");
}

function startPracticeFromReview(moleculeName) {
  const item = getReviewList().find((entry) => entry.name === moleculeName);
  if (!item) return;

  setMode("solo");
  setDrawingMode("canvas");
  roundCountSelect.value = "3";

  session.practiceTarget = {
    name: item.name,
    formula: item.formula,
    category: item.category,
    referenceImage: item.referenceImage,
    categoryKey: item.categoryKey || categorySelect.value,
  };

  if (item.categoryKey) {
    categorySelect.value = item.categoryKey;
  }

  startMatch();
}

function goHome() {
  timerEngine.stop();
  stopWebcamStream();
  setRoundInteractionEnabled(true);
  hideOverlay();
  addReviewBtn.textContent = "Add to Review Folder";
  showScreen("home");
}

soloModeBtn.addEventListener("click", () => setMode("solo"));
multiplayerModeBtn.addEventListener("click", () => setMode("multiplayer"));
canvasModeBtn.addEventListener("click", () => setDrawingMode("canvas"));
whiteboardModeBtn.addEventListener("click", () => setDrawingMode("whiteboard"));
createRoomBtn.addEventListener("click", createRoom);
joinRoomBtn.addEventListener("click", joinRoom);
startBtn.addEventListener("click", startMatch);
reviewBtn.addEventListener("click", () => {
  renderReviewList();
  showScreen("review");
});
reviewBackBtn.addEventListener("click", () => showScreen("home"));
nextRoundBtn.addEventListener("click", startNextRound);
playAgainBtn.addEventListener("click", goHome);
clearBtn.addEventListener("click", () => drawingEngine.clear());
submitBtn.addEventListener("click", () => finalizeRound("manual"));
addReviewBtn.addEventListener("click", addCurrentRoundToReview);

reviewList.addEventListener("click", (event) => {
  const practiceBtn = event.target.closest(".review-practice");
  if (practiceBtn) {
    startPracticeFromReview(practiceBtn.dataset.name);
    return;
  }

  const removeBtn = event.target.closest(".review-remove");
  if (removeBtn) {
    removeFromReview(removeBtn.dataset.name);
    renderReviewList();
    updateReviewButton();
  }
});

populateCategoryDropdown();
setMode("solo");
setDrawingMode("canvas");
updateReviewButton();
updateHud();
