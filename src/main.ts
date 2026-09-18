/**
 * Phase 1 — Compatibility Test
 *
 * Thin orchestrator: wires DOM events to the isolated modules in
 * ocr.ts, speech.ts, ui.ts, and storage.ts.
 */

import "./style.css";

import { readLocale, saveLocale, readTheme, saveTheme } from "./storage.js";
import { getVoiceState, speak, stopSpeech } from "./speech.js";
import { runOcr } from "./ocr.js";
import {
  t,
  showStatus,
  renderLocale,
  renderTheme,
  renderVoiceStatus,
  refreshOfflineDiagnostics,
} from "./ui.js";
import type { Locale, Theme, VoiceState } from "./types.js";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let locale: Locale = readLocale();
let theme: Theme = readTheme();
let voices: VoiceState = {};
let selectedImage: File | undefined;
let previewUrl: string | undefined;

// ---------------------------------------------------------------------------
// DOM element references
// ---------------------------------------------------------------------------

function req<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

const cameraInput = req<HTMLInputElement>("camera-input");
const photoInput = req<HTMLInputElement>("photo-input");
const preview = req<HTMLImageElement>("preview");
const imageStatus = req<HTMLParagraphElement>("image-status");
const ocrButton = req<HTMLButtonElement>("ocr-button");
const ocrStatus = req<HTMLParagraphElement>("ocr-status");
const ocrResult = req<HTMLTextAreaElement>("ocr-result");
const ocrProgress = req<HTMLDivElement>("ocr-progress");
const progressBar = req<HTMLDivElement>("progress-bar");
const langToggle = req<HTMLButtonElement>("language-toggle");
const themeToggle = req<HTMLButtonElement>("theme-toggle");
const englishSpeechBtn = req<HTMLButtonElement>("english-speech");
const arabicSpeechBtn = req<HTMLButtonElement>("arabic-speech");
const stopSpeechBtn = req<HTMLButtonElement>("stop-speech");
const refreshBtn = req<HTMLButtonElement>("refresh-diagnostics");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tr(key: string, vars: Record<string, string | number> = {}): string {
  return t(locale, key, vars);
}

// ---------------------------------------------------------------------------
// Image selection
// ---------------------------------------------------------------------------

function handleImageSelection(input: HTMLInputElement): void {
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showStatus(imageStatus, tr("image_only"), "error");
    return;
  }

  selectedImage = file;

  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  preview.src = previewUrl;
  preview.hidden = false;

  ocrButton.disabled = false;
  showStatus(
    imageStatus,
    tr("image_selected", { name: file.name || tr("camera_photo") }),
    "success",
  );
  showStatus(ocrStatus, tr("image_ready"));
}

// ---------------------------------------------------------------------------
// OCR run
// ---------------------------------------------------------------------------

async function handleOcr(): Promise<void> {
  if (!selectedImage) return;
  ocrButton.disabled = true;
  ocrProgress.hidden = false;
  ocrResult.value = "";

  try {
    showStatus(ocrStatus, tr("preparing_image"));

    // runOcr calls prepareImage internally — we use the exported one here
    // only to show the "preparing" state, then hand off to the full pipeline.
    const result = await runOcr(selectedImage, (msg) => {
      const pct = Math.round(msg.progress * 100);
      progressBar.style.width = `${pct}%`;
      showStatus(ocrStatus, tr("ocr_progress", { status: msg.status, percent: pct }));
    });

    progressBar.style.width = "100%";
    ocrResult.value = result.text;

    if (result.empty) {
      showStatus(ocrStatus, tr("ocr_empty"), "error");
    } else {
      showStatus(ocrStatus, tr("ocr_success"), "success");
    }
  } catch {
    showStatus(ocrStatus, tr("ocr_failed"), "error");
  } finally {
    ocrButton.disabled = false;
    // Hide progress bar after a short delay so the user sees 100%
    setTimeout(() => {
      ocrProgress.hidden = true;
      progressBar.style.width = "0%";
    }, 800);
  }
}

// ---------------------------------------------------------------------------
// Voice refresh
// ---------------------------------------------------------------------------

function handleVoicesChanged(): void {
  voices = getVoiceState();
  renderVoiceStatus(locale, voices);
}

// ---------------------------------------------------------------------------
// Render — applied on every locale/theme change
// ---------------------------------------------------------------------------

function render(): void {
  renderTheme(theme);
  renderLocale(locale);
  renderVoiceStatus(locale, voices);
}

// ---------------------------------------------------------------------------
// Service Worker registration
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
// Event wiring
// ---------------------------------------------------------------------------

cameraInput.addEventListener("change", () => handleImageSelection(cameraInput));
photoInput.addEventListener("change", () => handleImageSelection(photoInput));
ocrButton.addEventListener("click", () => void handleOcr());

englishSpeechBtn.addEventListener("click", () =>
  speak("This is an English speech test.", voices.english),
);
arabicSpeechBtn.addEventListener("click", () =>
  speak("هذا اختبار للصوت العربي.", voices.arabic),
);
stopSpeechBtn.addEventListener("click", stopSpeech);

refreshBtn.addEventListener("click", () =>
  void refreshOfflineDiagnostics(locale),
);

langToggle.addEventListener("click", () => {
  locale = locale === "ar" ? "en" : "ar";
  saveLocale(locale);
  render();
  void refreshOfflineDiagnostics(locale);
});

themeToggle.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  saveTheme(theme);
  render();
});

window.addEventListener("beforeunload", () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

// Listen for async voice loading (Safari loads voices asynchronously)
if ("speechSynthesis" in window) {
  window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
}

// Initial render before anything async
render();

// Initial voice query (may return empty on first call in Safari — voiceschanged handles it)
voices = getVoiceState();
renderVoiceStatus(locale, voices);

// Register SW then run diagnostics
void registerServiceWorker().then(() => refreshOfflineDiagnostics(locale));
