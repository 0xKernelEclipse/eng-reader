/**
 * English Vocabulary Reader for iPhone / Android / Desktop
 *
 * Full application orchestrator:
 * - Photo capture & preprocessing
 * - Local Tesseract OCR with progress tracking
 * - Vocabulary extraction & Arabic dictionary matching (800+ core words + lemmatization)
 * - Custom user meaning editor saved to localStorage
 * - Speech queue with sequential repetition (English x 3 -> Arabic x 1)
 * - Intelligent voice quality ranking & customizable voice dropdowns
 * - Interactive player with big touch controls
 * - Settings & Diagnostics drawer
 */

import "./style.css";

import {
  readLocale,
  saveLocale,
  readTheme,
  saveTheme,
  readSpeed,
  saveSpeed,
  readRepetitions,
  saveRepetitions,
  readVocabMode,
  saveVocabMode,
  saveCachedWords,
  readCachedWords,
  readPreferredVoiceUri,
  savePreferredVoiceUri,
  saveCustomMeaning,
} from "./storage.js";
import {
  getVoiceState,
  speak,
  stopSpeech,
  VocabularyPlayer,
  setPreferredVoiceUri,
  getAvailableVoicesForLanguage,
} from "./speech.js";
import { runOcr } from "./ocr.js";
import { extractVocabulary } from "./vocabulary.js";
import {
  t,
  req,
  showStatus,
  renderLocale,
  renderTheme,
  renderVoiceStatus,
  renderPlayerUI,
  renderWordList,
  refreshOfflineDiagnostics,
} from "./ui.js";
import type {
  Locale,
  Theme,
  VoiceState,
  VocabularyItem,
  VocabularyMode,
  PlayerState,
} from "./types.js";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let locale: Locale = readLocale();
let theme: Theme = readTheme();
let speed: number = readSpeed();
let repetitions: number = readRepetitions();
let vocabMode: VocabularyMode = readVocabMode();

// Initialize saved preferred voices if any
const savedEnVoice = readPreferredVoiceUri("english");
if (savedEnVoice) setPreferredVoiceUri("english", savedEnVoice);

const savedArVoice = readPreferredVoiceUri("arabic");
if (savedArVoice) setPreferredVoiceUri("arabic", savedArVoice);

let voices: VoiceState = {};
let selectedImage: File | undefined;
let previewUrl: string | undefined;
let wordsList: VocabularyItem[] = [];

// ---------------------------------------------------------------------------
// Helper: Translation with current locale
// ---------------------------------------------------------------------------

function tr(key: string, vars: Record<string, string | number> = {}): string {
  return t(locale, key, vars);
}

// ---------------------------------------------------------------------------
// Speech Player Initialization
// ---------------------------------------------------------------------------

const player = new VocabularyPlayer(
  () => voices,
  (state: PlayerState, currentItem?: VocabularyItem) => {
    renderPlayerUI(state, currentItem, locale);
  },
  repetitions,
  speed,
);

// ---------------------------------------------------------------------------
// DOM Elements
// ---------------------------------------------------------------------------

const cameraInput = req<HTMLInputElement>("camera-input");
const photoInput = req<HTMLInputElement>("photo-input");
const sampleButton = req<HTMLButtonElement>("sample-button");
const preview = req<HTMLImageElement>("preview");
const imageStatus = req<HTMLParagraphElement>("image-status");

const ocrButton = req<HTMLButtonElement>("ocr-button");
const ocrStatus = req<HTMLParagraphElement>("ocr-status");
const ocrProgress = req<HTMLDivElement>("ocr-progress");
const progressBar = req<HTMLDivElement>("progress-bar");
const ocrResult = req<HTMLTextAreaElement>("ocr-result");

const langToggle = req<HTMLButtonElement>("language-toggle");
const themeToggle = req<HTMLButtonElement>("theme-toggle");
const settingsToggleBtn = req<HTMLButtonElement>("settings-toggle-btn");
const settingsDetails = req<HTMLDetailsElement>("settings-details");

const playerPlayPause = req<HTMLButtonElement>("player-play-pause");
const playerPrev = req<HTMLButtonElement>("player-prev");
const playerNext = req<HTMLButtonElement>("player-next");
const playerReplay = req<HTMLButtonElement>("player-replay");
const playerStop = req<HTMLButtonElement>("player-stop");
const editMeaningBtn = req<HTMLButtonElement>("edit-meaning-btn");

const englishVoiceSelect = req<HTMLSelectElement>("english-voice-select");
const arabicVoiceSelect = req<HTMLSelectElement>("arabic-voice-select");

const englishSpeechBtn = req<HTMLButtonElement>("english-speech");
const arabicSpeechBtn = req<HTMLButtonElement>("arabic-speech");
const stopSpeechBtn = req<HTMLButtonElement>("stop-speech");
const refreshBtn = req<HTMLButtonElement>("refresh-diagnostics");

// ---------------------------------------------------------------------------
// Image Loading & Handling
// ---------------------------------------------------------------------------

function setImageFile(file: File, displayName: string): void {
  selectedImage = file;

  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  preview.src = previewUrl;
  preview.hidden = false;

  ocrButton.disabled = false;
  showStatus(imageStatus, tr("image_selected", { name: displayName }), "success");
  showStatus(ocrStatus, tr("ocr_idle"));
}

function handleFileInput(input: HTMLInputElement): void {
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/") && !file.name.endsWith(".svg")) {
    showStatus(imageStatus, tr("image_only"), "error");
    return;
  }
  setImageFile(file, file.name || tr("camera_photo"));
}

async function loadSampleTextbookImage(): Promise<void> {
  try {
    showStatus(imageStatus, tr("sample_loaded"), "normal");
    const response = await fetch("/test-images/mom-textbook-page.svg");
    if (!response.ok) throw new Error("Could not load sample image");
    const blob = await response.blob();
    const file = new File([blob], "sample-textbook-page.svg", {
      type: "image/svg+xml",
    });
    setImageFile(file, "Sample Page (Our Environment)");
  } catch (err) {
    showStatus(imageStatus, "Could not load sample textbook page.", "error");
  }
}

// ---------------------------------------------------------------------------
// OCR & Vocabulary Pipeline
// ---------------------------------------------------------------------------

async function handleOcr(): Promise<void> {
  if (!selectedImage) return;

  player.stop();
  ocrButton.disabled = true;
  ocrProgress.hidden = false;
  progressBar.style.width = "0%";
  ocrResult.value = "";

  try {
    showStatus(ocrStatus, tr("preparing_image"));

    const result = await runOcr(selectedImage, (msg) => {
      const pct = Math.round(msg.progress * 100);
      progressBar.style.width = `${pct}%`;
      showStatus(
        ocrStatus,
        tr("ocr_progress", { status: msg.status, percent: pct }),
      );
    });

    progressBar.style.width = "100%";
    ocrResult.value = result.text;

    if (result.empty) {
      showStatus(ocrStatus, tr("ocr_empty"), "error");
      return;
    }

    // Extract vocabulary and match with offline Arabic dictionary
    wordsList = extractVocabulary(result.text, vocabMode, tr("no_meaning"));

    if (wordsList.length === 0) {
      showStatus(ocrStatus, tr("ocr_empty"), "error");
      return;
    }

    saveCachedWords(wordsList);
    showStatus(ocrStatus, tr("words_found", { count: wordsList.length }), "success");

    // Load into speech player and render word list
    player.load(wordsList);
    renderWordList(wordsList, 0, locale, (idx) => {
      player.jumpToWord(idx);
    });

    // Auto scroll down to the player card
    const playerCard = document.getElementById("player-card");
    if (playerCard) {
      playerCard.scrollIntoView({ behavior: "smooth" });
    }
  } catch (err) {
    showStatus(ocrStatus, tr("ocr_failed"), "error");
  } finally {
    ocrButton.disabled = false;
    setTimeout(() => {
      ocrProgress.hidden = true;
      progressBar.style.width = "0%";
    }, 800);
  }
}

// ---------------------------------------------------------------------------
// Edit Meaning Inline Handler
// ---------------------------------------------------------------------------

function handleEditMeaning(): void {
  const state = player.getState();
  if (wordsList.length === 0 || state.currentIndex >= wordsList.length) return;

  const currentItem = wordsList[state.currentIndex];
  if (!currentItem) return;

  const defaultVal =
    currentItem.arabicMeaning === tr("no_meaning")
      ? ""
      : currentItem.arabicMeaning;

  const input = window.prompt(
    `${tr("prompt_enter_meaning")} "${currentItem.word}":`,
    defaultVal,
  );

  if (input !== null && input.trim()) {
    const trimmed = input.trim();
    saveCustomMeaning(currentItem.cleanWord, trimmed);
    currentItem.arabicMeaning = trimmed;
    currentItem.foundInDictionary = true;
    saveCachedWords(wordsList);
    renderAll();
    // Immediate audio verification of the new Arabic meaning
    speak(trimmed, voices.arabic);
  }
}

// ---------------------------------------------------------------------------
// Voice Selectors Population & Management
// ---------------------------------------------------------------------------

function populateVoiceSelectors(): void {
  const enVoices = getAvailableVoicesForLanguage("english");
  const arVoices = getAvailableVoicesForLanguage("arabic");

  // English Dropdown
  englishVoiceSelect.innerHTML = "";
  if (enVoices.length === 0) {
    englishVoiceSelect.innerHTML = `<option value="">${tr("no_english_voice")}</option>`;
  } else {
    for (const v of enVoices) {
      const opt = document.createElement("option");
      opt.value = v.voiceURI || v.name;
      opt.textContent = `${v.name} (${v.lang})${v.localService ? " [Local]" : ""}`;
      if (voices.english && (v.voiceURI === voices.english.voiceURI || v.name === voices.english.name)) {
        opt.selected = true;
      }
      englishVoiceSelect.appendChild(opt);
    }
  }

  // Arabic Dropdown
  arabicVoiceSelect.innerHTML = "";
  if (arVoices.length === 0) {
    arabicVoiceSelect.innerHTML = `<option value="">${tr("no_arabic_voice")}</option>`;
  } else {
    for (const v of arVoices) {
      const opt = document.createElement("option");
      opt.value = v.voiceURI || v.name;
      opt.textContent = `${v.name} (${v.lang})${v.localService ? " [Local]" : ""}`;
      if (voices.arabic && (v.voiceURI === voices.arabic.voiceURI || v.name === voices.arabic.name)) {
        opt.selected = true;
      }
      arabicVoiceSelect.appendChild(opt);
    }
  }
}

englishVoiceSelect.addEventListener("change", () => {
  const uri = englishVoiceSelect.value;
  if (!uri) return;
  setPreferredVoiceUri("english", uri);
  savePreferredVoiceUri("english", uri);
  voices = getVoiceState();
  renderVoiceStatus(locale, voices);
  speak("choose", voices.english, speed); // Instant test of the chosen voice pronouncing "choose"
});

arabicVoiceSelect.addEventListener("change", () => {
  const uri = arabicVoiceSelect.value;
  if (!uri) return;
  setPreferredVoiceUri("arabic", uri);
  savePreferredVoiceUri("arabic", uri);
  voices = getVoiceState();
  renderVoiceStatus(locale, voices);
  speak("يختار", voices.arabic, speed);
});

// ---------------------------------------------------------------------------
// Settings Controls (Speed, Repetitions, Vocab Mode)
// ---------------------------------------------------------------------------

function updateSpeed(newSpeed: number): void {
  speed = newSpeed;
  saveSpeed(speed);
  player.setConfig(repetitions, speed);
  document.querySelectorAll("#speed-selector .pill-btn").forEach((btn) => {
    const val = parseFloat((btn as HTMLElement).dataset["value"] || "1.0");
    btn.classList.toggle("active", Math.abs(val - speed) < 0.05);
  });
}

function updateRepetitions(newReps: number): void {
  repetitions = newReps;
  saveRepetitions(repetitions);
  player.setConfig(repetitions, speed);
  document.querySelectorAll("#reps-selector .pill-btn").forEach((btn) => {
    const val = parseInt((btn as HTMLElement).dataset["value"] || "3", 10);
    btn.classList.toggle("active", val === repetitions);
  });
}

function updateVocabMode(newMode: VocabularyMode): void {
  vocabMode = newMode;
  saveVocabMode(vocabMode);
  document.querySelectorAll("#mode-selector .pill-btn").forEach((btn) => {
    const val = (btn as HTMLElement).dataset["value"];
    btn.classList.toggle("active", val === vocabMode);
  });

  // If raw OCR text exists, re-extract vocabulary with new mode
  if (ocrResult.value.trim()) {
    wordsList = extractVocabulary(ocrResult.value, vocabMode, tr("no_meaning"));
    player.load(wordsList);
    renderWordList(wordsList, 0, locale, (idx) => player.jumpToWord(idx));
  }
}

function setupPillSelectors(): void {
  document.querySelectorAll("#speed-selector .pill-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = parseFloat((btn as HTMLElement).dataset["value"] || "1.0");
      updateSpeed(val);
      // Brief test of the new speed
      speak("choose", voices.english, val);
    });
  });

  document.querySelectorAll("#reps-selector .pill-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = parseInt((btn as HTMLElement).dataset["value"] || "3", 10);
      updateRepetitions(val);
    });
  });

  document.querySelectorAll("#mode-selector .pill-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = (btn as HTMLElement).dataset["value"] as VocabularyMode;
      if (val) updateVocabMode(val);
    });
  });
}

// ---------------------------------------------------------------------------
// Render All
// ---------------------------------------------------------------------------

function renderAll(): void {
  renderTheme(theme);
  renderLocale(locale);
  renderVoiceStatus(locale, voices);
  renderPlayerUI(player.getState(), wordsList[player.getState().currentIndex], locale);
  renderWordList(wordsList, player.getState().currentIndex, locale, (idx) => {
    player.jumpToWord(idx);
  });
}

// ---------------------------------------------------------------------------
// Service Worker Registration
// ---------------------------------------------------------------------------

async function registerServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/service-worker.js");
    await navigator.serviceWorker.ready;
  } catch {
    const swStatus = document.getElementById("sw-status");
    if (swStatus) showStatus(swStatus, tr("sw_failed"), "error");
  }
}

// ---------------------------------------------------------------------------
// Event Wiring
// ---------------------------------------------------------------------------

cameraInput.addEventListener("change", () => handleFileInput(cameraInput));
photoInput.addEventListener("change", () => handleFileInput(photoInput));
sampleButton.addEventListener("click", () => void loadSampleTextbookImage());
ocrButton.addEventListener("click", () => void handleOcr());
editMeaningBtn.addEventListener("click", handleEditMeaning);

// Player buttons
playerPlayPause.addEventListener("click", () => {
  const state = player.getState();
  if (state.status === "playing") {
    player.pause();
  } else if (state.status === "paused") {
    player.resume();
  } else {
    player.play();
  }
});

playerPrev.addEventListener("click", () => player.previousWord());
playerNext.addEventListener("click", () => player.nextWord());
playerReplay.addEventListener("click", () => player.replayWord());
playerStop.addEventListener("click", () => player.stop());

// Quick toolbar buttons
langToggle.addEventListener("click", () => {
  locale = locale === "ar" ? "en" : "ar";
  saveLocale(locale);
  renderAll();
  populateVoiceSelectors();
  void refreshOfflineDiagnostics(locale);
});

themeToggle.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  saveTheme(theme);
  renderTheme(theme);
});

settingsToggleBtn.addEventListener("click", () => {
  settingsDetails.open = !settingsDetails.open;
  if (settingsDetails.open) {
    settingsDetails.scrollIntoView({ behavior: "smooth" });
  }
});

// Diagnostics buttons
englishSpeechBtn.addEventListener("click", () =>
  speak("Choose the correct answer for your test.", voices.english, speed),
);
arabicSpeechBtn.addEventListener("click", () =>
  speak("هذا اختبار للصوت العربي الواضح.", voices.arabic, speed),
);
stopSpeechBtn.addEventListener("click", stopSpeech);
refreshBtn.addEventListener("click", () => {
  voices = getVoiceState();
  populateVoiceSelectors();
  void refreshOfflineDiagnostics(locale);
});

window.addEventListener("beforeunload", () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

if ("speechSynthesis" in window) {
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    voices = getVoiceState();
    renderVoiceStatus(locale, voices);
    populateVoiceSelectors();
  });
}

// Load cached words from previous session if available
const cached = readCachedWords();
if (cached && cached.length > 0) {
  wordsList = cached;
  player.load(wordsList);
}

setupPillSelectors();
updateSpeed(speed);
updateRepetitions(repetitions);
updateVocabMode(vocabMode);

renderAll();

voices = getVoiceState();
renderVoiceStatus(locale, voices);
populateVoiceSelectors();

void registerServiceWorker().then(() => refreshOfflineDiagnostics(locale));
