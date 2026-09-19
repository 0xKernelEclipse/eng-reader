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
import { CropController } from "./crop.js";
import { lookupWord } from "./dictionary.js";
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

let currentImageDataUrl: string | undefined;
let cropController: CropController | null = null;

const cropSection = document.getElementById("crop-section") as HTMLElement;
const cropContainer = document.getElementById("crop-container") as HTMLElement;

function showCropStep(dataUrl: string): void {
  currentImageDataUrl = dataUrl;
  cropSection.style.display = "";
  cropSection.scrollIntoView({ behavior: "smooth" });

  cropController?.destroy();
  cropController = new CropController(
    cropContainer,
    dataUrl,
    (croppedDataUrl) => {
      // User confirmed crop → run OCR on cropped image
      cropSection.style.display = "none";
      currentImageDataUrl = croppedDataUrl;
      preview.src = croppedDataUrl;
      preview.hidden = false;
      void runOcrOnDataUrl(croppedDataUrl);
    },
    () => {
      // User skipped crop → run OCR on original image
      cropSection.style.display = "none";
      void runOcrOnDataUrl(dataUrl);
    },
  );
  cropController.show();
}

function setImageFile(file: File, displayName: string): void {
  selectedImage = file;

  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  preview.src = previewUrl;
  preview.hidden = false;

  ocrButton.disabled = false;
  showStatus(imageStatus, tr("image_selected", { name: displayName }), "success");
  showStatus(ocrStatus, tr("ocr_idle"));

  // Read file as dataURL and launch the crop step
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") {
      showCropStep(reader.result);
    }
  };
  reader.readAsDataURL(file);
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
// Word List UI Helpers (checkboxes, toolbar, add-word)
// ---------------------------------------------------------------------------

function updateSelectionToolbar(): void {
  const toolbar = document.getElementById("word-selection-toolbar");
  const label = document.getElementById("selected-count-label");
  const addPanel = document.getElementById("add-word-panel");
  if (!toolbar || !label) return;
  const total = wordsList.length;
  const selected = wordsList.filter((w) => w.selected).length;
  toolbar.style.display = total > 0 ? "" : "none";
  if (addPanel) addPanel.style.display = total > 0 ? "" : "none";
  label.textContent = `${selected} / ${total} selected`;
}

function loadSelectedIntoPlayer(): void {
  const selected = wordsList.filter((w) => w.selected);
  player.load(selected.length > 0 ? selected : wordsList);
}

// ---------------------------------------------------------------------------
// OCR Pipeline
// ---------------------------------------------------------------------------

async function runOcrOnDataUrl(dataUrl: string): Promise<void> {
  player.stop();
  ocrButton.disabled = true;
  ocrProgress.hidden = false;
  progressBar.style.width = "0%";
  ocrResult.value = "";

  try {
    showStatus(ocrStatus, tr("preparing_image"));

    // Convert dataUrl to Blob for Tesseract
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], "image.jpg", { type: blob.type || "image/jpeg" });

    const result = await runOcr(file, (msg) => {
      const pct = Math.round(msg.progress * 100);
      progressBar.style.width = `${pct}%`;
      showStatus(ocrStatus, tr("ocr_progress", { status: msg.status, percent: pct }));
    });

    progressBar.style.width = "100%";
    ocrResult.value = result.text;

    if (result.empty) {
      showStatus(ocrStatus, tr("ocr_empty"), "error");
      return;
    }

    wordsList = extractVocabulary(result.text, vocabMode, tr("no_meaning"));

    if (wordsList.length === 0) {
      showStatus(ocrStatus, tr("ocr_empty"), "error");
      return;
    }

    saveCachedWords(wordsList);
    showStatus(ocrStatus, tr("words_found", { count: wordsList.length }), "success");

    loadSelectedIntoPlayer();
    renderWordList(wordsList, 0, locale, (idx) => {
      // Jump to this word in the selected subset
      const item = wordsList[idx];
      if (!item) return;
      const selectedList = wordsList.filter((w) => w.selected);
      const selIdx = selectedList.findIndex((w) => w.id === item.id);
      if (selIdx >= 0) player.jumpToWord(selIdx);
    }, onWordCheckboxToggle);
    updateSelectionToolbar();

    const playerCard = document.getElementById("player-card");
    if (playerCard) playerCard.scrollIntoView({ behavior: "smooth" });
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

async function handleOcr(): Promise<void> {
  if (currentImageDataUrl) {
    await runOcrOnDataUrl(currentImageDataUrl);
  } else if (selectedImage) {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        void runOcrOnDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(selectedImage);
  }
}

function onWordCheckboxToggle(idx: number, checked: boolean): void {
  if (wordsList[idx]) wordsList[idx]!.selected = checked;
  updateSelectionToolbar();
  loadSelectedIntoPlayer();
  saveCachedWords(wordsList);
}

// ---------------------------------------------------------------------------
// Add Custom Word to Queue
// ---------------------------------------------------------------------------

async function handleAddWord(): Promise<void> {
  const engInput = document.getElementById("add-word-english") as HTMLInputElement;
  const arInput = document.getElementById("add-word-arabic") as HTMLInputElement;
  const statusEl = document.getElementById("add-word-status") as HTMLParagraphElement;

  const eng = engInput.value.trim();
  if (!eng) {
    statusEl.textContent = "Please type an English word first.";
    return;
  }

  const cleanWord = eng.toLowerCase().replace(/[^a-z'-]/g, "");
  const displayWord = eng.charAt(0).toUpperCase() + eng.slice(1);

  // Deduplicate
  if (wordsList.some((w) => w.cleanWord === cleanWord)) {
    statusEl.textContent = `"${displayWord}" is already in the list.`;
    engInput.value = "";
    arInput.value = "";
    return;
  }

  // Meaning: user input → dictionary → "no meaning"
  let arabicMeaning = arInput.value.trim();
  if (!arabicMeaning) {
    const found = lookupWord(cleanWord);
    arabicMeaning = found ? found.primary : tr("no_meaning");
  }

  // If user provided Arabic, save it as custom meaning
  if (arInput.value.trim()) {
    saveCustomMeaning(cleanWord, arInput.value.trim());
  }

  const newItem: VocabularyItem = {
    id: `custom-${Date.now()}`,
    word: displayWord,
    cleanWord,
    arabicMeaning,
    allMeanings: [arabicMeaning],
    foundInDictionary: Boolean(arInput.value.trim()),
    selected: true,
    isCustom: true,
  };

  wordsList.push(newItem);
  saveCachedWords(wordsList);
  loadSelectedIntoPlayer();
  renderWordList(wordsList, player.getState().currentIndex, locale, (idx) => {
    const item = wordsList[idx];
    if (!item) return;
    const selectedList = wordsList.filter((w) => w.selected);
    const selIdx = selectedList.findIndex((w) => w.id === item.id);
    if (selIdx >= 0) player.jumpToWord(selIdx);
  }, onWordCheckboxToggle);
  updateSelectionToolbar();

  statusEl.textContent = `✓ Added "${displayWord}" to the list.`;
  engInput.value = "";
  arInput.value = "";
  setTimeout(() => { statusEl.textContent = ""; }, 3000);
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
    loadSelectedIntoPlayer();
    renderWordList(
      wordsList,
      0,
      locale,
      (idx) => {
        const item = wordsList[idx];
        if (!item) return;
        const selectedList = wordsList.filter((w) => w.selected);
        const selIdx = selectedList.findIndex((w) => w.id === item.id);
        if (selIdx >= 0) player.jumpToWord(selIdx);
      },
      onWordCheckboxToggle,
    );
    updateSelectionToolbar();
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
  renderWordList(
    wordsList,
    player.getState().currentIndex,
    locale,
    (idx) => {
      const item = wordsList[idx];
      if (!item) return;
      const selectedList = wordsList.filter((w) => w.selected);
      const selIdx = selectedList.findIndex((w) => w.id === item.id);
      if (selIdx >= 0) player.jumpToWord(selIdx);
    },
    onWordCheckboxToggle,
  );
  updateSelectionToolbar();
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

// Word selection toolbar
document.getElementById("select-all-btn")?.addEventListener("click", () => {
  wordsList.forEach((w) => (w.selected = true));
  updateSelectionToolbar();
  loadSelectedIntoPlayer();
  renderWordList(wordsList, player.getState().currentIndex, locale, (idx) => {
    const item = wordsList[idx];
    if (!item) return;
    const selectedList = wordsList.filter((w) => w.selected);
    const selIdx = selectedList.findIndex((w) => w.id === item.id);
    if (selIdx >= 0) player.jumpToWord(selIdx);
  }, onWordCheckboxToggle);
  saveCachedWords(wordsList);
});

document.getElementById("select-none-btn")?.addEventListener("click", () => {
  wordsList.forEach((w) => (w.selected = false));
  updateSelectionToolbar();
  loadSelectedIntoPlayer();
  renderWordList(wordsList, player.getState().currentIndex, locale, (idx) => {
    const item = wordsList[idx];
    if (!item) return;
    const selectedList = wordsList.filter((w) => w.selected);
    const selIdx = selectedList.findIndex((w) => w.id === item.id);
    if (selIdx >= 0) player.jumpToWord(selIdx);
  }, onWordCheckboxToggle);
  saveCachedWords(wordsList);
});

// Add word button
document.getElementById("add-word-btn")?.addEventListener("click", () => void handleAddWord());

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
