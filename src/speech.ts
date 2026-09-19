/**
 * Speech Synthesis & Vocabulary Audio Queue Engine
 *
 * Designed for older WebKit / Safari 15.8.8 and modern browsers:
 * - Robust queue management for repeating sequences: [English x N] -> [Arabic x 1]
 * - Voice ranking algorithm preferring Natural/Neural, Google, and Apple high-quality voices
 * - Explicit language and voice binding to prevent wrong-accent/phoneme pronunciation
 * - Retains active utterance reference to prevent Safari GC cutoffs
 * - Default natural rate (1.0) with clean pitch and no robotic timestretch distortion
 * - Full playback controls: play, pause, resume, stop, next, previous, replay, jump
 */

import type {
  PlayerState,
  PlaybackStatus,
  VocabularyItem,
  VoiceState,
} from "./types.js";

// ---------------------------------------------------------------------------
// Voice Quality Scoring & Selection
// ---------------------------------------------------------------------------

/**
 * Score a voice based on quality, accent, and platform engine.
 * Higher score = higher priority.
 */
function scoreVoice(voice: SpeechSynthesisVoice, language: "english" | "arabic"): number {
  const lang = voice.lang.toLowerCase().replace(/_/g, "-");
  const name = voice.name.toLowerCase();

  if (language === "english") {
    // Must be an English voice
    if (!lang.startsWith("en")) return -10000;

    let score = 50;

    // Dialect preference: en-US, en-GB
    if (lang === "en-us") score += 30;
    else if (lang === "en-gb") score += 25;
    else if (lang.startsWith("en")) score += 10;

    // Quality boosters: Modern Neural / Natural voices (Edge, Windows 11)
    if (name.includes("natural") || name.includes("online (natural)")) score += 300;
    // Google voices (Chrome, Android)
    if (name.includes("google")) score += 200;
    // Apple premium voices (iOS, macOS)
    if (
      name.includes("samantha") ||
      name.includes("daniel") ||
      name.includes("karen") ||
      name.includes("siri") ||
      name.includes("ava") ||
      name.includes("premium") ||
      name.includes("enhanced")
    ) {
      score += 250;
    }
    // Windows Zira is clearer than ancient David
    if (name.includes("zira")) score += 80;
    if (name.includes("jenny") || name.includes("aria") || name.includes("guy")) score += 150;

    // Penalize legacy robotic desktop SAPI voices (like Windows David Desktop)
    if (name.includes("desktop")) score -= 30;
    if (name.includes("david") && !name.includes("natural")) score -= 20;

    return score;
  } else {
    // Arabic
    if (!lang.startsWith("ar")) return -10000;

    let score = 50;

    // Dialect preference: Egyptian (ar-EG) is widely understood school standard
    if (lang === "ar-eg") score += 40;
    else if (lang === "ar-sa") score += 30;
    else if (lang.startsWith("ar")) score += 20;

    // Quality boosters
    if (name.includes("natural") || name.includes("online (natural)")) score += 300;
    if (name.includes("google")) score += 200;
    if (
      name.includes("salma") ||
      name.includes("shakir") ||
      name.includes("maged") ||
      name.includes("tarik") ||
      name.includes("laila") ||
      name.includes("mariam") ||
      name.includes("hoda")
    ) {
      score += 150;
    }

    return score;
  }
}

let preferredEnglishUri: string | null = null;
let preferredArabicUri: string | null = null;

export function setPreferredVoiceUri(language: "english" | "arabic", uri: string | null): void {
  if (language === "english") preferredEnglishUri = uri;
  else preferredArabicUri = uri;
}

export function getPreferredVoiceUri(language: "english" | "arabic"): string | null {
  return language === "english" ? preferredEnglishUri : preferredArabicUri;
}

/**
 * Filter all available voices for a given language, sorted by quality score descending.
 */
export function getAvailableVoicesForLanguage(
  language: "english" | "arabic",
): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const available = window.speechSynthesis.getVoices();
  const prefix = language === "english" ? "en" : "ar";

  return available
    .filter((v) => v.lang.toLowerCase().startsWith(prefix))
    .sort((a, b) => scoreVoice(b, language) - scoreVoice(a, language));
}

/**
 * Pick the best available voice for a language.
 */
export function chooseVoice(
  available: SpeechSynthesisVoice[],
  language: "english" | "arabic",
): SpeechSynthesisVoice | undefined {
  if (!available || available.length === 0) return undefined;

  const targetUri = language === "english" ? preferredEnglishUri : preferredArabicUri;
  if (targetUri) {
    const matched = available.find((v) => v.voiceURI === targetUri || v.name === targetUri);
    if (matched) return matched;
  }

  const prefix = language === "english" ? "en" : "ar";
  const candidates = available.filter((v) => v.lang.toLowerCase().startsWith(prefix));
  if (candidates.length === 0) return undefined;

  candidates.sort((a, b) => scoreVoice(b, language) - scoreVoice(a, language));
  return candidates[0];
}

export function describeVoice(
  voice: SpeechSynthesisVoice | undefined,
  language: "english" | "arabic",
  t: (key: string) => string,
): string {
  if (!voice) {
    return t(language === "english" ? "no_english_voice" : "no_arabic_voice");
  }
  const locality = voice.localService ? t("local") : t("online_voice");
  return `${voice.name} (${voice.lang}) — ${locality}`;
}

export function getVoiceState(): VoiceState {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return {};
  const available = window.speechSynthesis.getVoices();
  return {
    english: chooseVoice(available, "english"),
    arabic: chooseVoice(available, "arabic"),
  };
}

// ---------------------------------------------------------------------------
// Single Utterance Test Helper
// ---------------------------------------------------------------------------

let testUtterance: SpeechSynthesisUtterance | null = null;

export function speak(
  text: string,
  voice: SpeechSynthesisVoice | undefined,
  rate = 1.0,
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();

  // Fresh voice lookup if not provided
  let resolvedVoice = voice;
  if (!resolvedVoice) {
    const available = synth.getVoices();
    // Check if English or Arabic by characters
    const hasArabicChars = /[\u0600-\u06FF]/.test(text);
    resolvedVoice = chooseVoice(available, hasArabicChars ? "arabic" : "english");
  }

  testUtterance = new SpeechSynthesisUtterance(text);
  if (resolvedVoice) {
    testUtterance.voice = resolvedVoice;
    testUtterance.lang = resolvedVoice.lang;
  } else {
    testUtterance.lang = /[\u0600-\u06FF]/.test(text) ? "ar-EG" : "en-US";
  }

  // Use natural pitch and rate (clamp rate between 0.5 and 1.5)
  testUtterance.rate = Math.max(0.6, Math.min(rate, 1.4));
  testUtterance.pitch = 1.0;

  testUtterance.onend = () => {
    testUtterance = null;
  };
  testUtterance.onerror = () => {
    testUtterance = null;
  };

  synth.speak(testUtterance);
}

export function stopSpeech(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

// ---------------------------------------------------------------------------
// Vocabulary Queue Controller
// ---------------------------------------------------------------------------

export type StateChangeCallback = (state: PlayerState, currentItem?: VocabularyItem) => void;

export class VocabularyPlayer {
  private items: VocabularyItem[] = [];
  private currentIndex = 0;
  private currentRepetition = 1; // 1..repetitions for EN
  private isSpeakingArabic = false;
  private status: PlaybackStatus = "idle";
  private repetitions = 3;
  private speed = 0.9; // Slightly under natural rate — clear, no distortion
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private timer: number | null = null;
  private onStateChange: StateChangeCallback;
  private getVoices: () => VoiceState;

  constructor(
    getVoices: () => VoiceState,
    onStateChange: StateChangeCallback,
    initialRepetitions = 3,
    initialSpeed = 0.9,
  ) {
    this.getVoices = getVoices;
    this.onStateChange = onStateChange;
    this.repetitions = initialRepetitions;
    this.speed = initialSpeed;
  }

  public setConfig(repetitions: number, speed: number): void {
    this.repetitions = repetitions;
    this.speed = speed;
    this.notifyState();
  }

  public load(items: VocabularyItem[]): void {
    this.stop();
    this.items = items;
    this.currentIndex = 0;
    this.currentRepetition = 1;
    this.isSpeakingArabic = false;
    this.status = "idle";
    this.notifyState();
  }

  public play(fromIndex?: number): void {
    if (this.items.length === 0) return;

    if (fromIndex !== undefined && fromIndex >= 0 && fromIndex < this.items.length) {
      this.currentIndex = fromIndex;
      this.currentRepetition = 1;
      this.isSpeakingArabic = false;
    }

    this.status = "playing";
    this.speakCurrentStep();
  }

  public pause(): void {
    if (this.status !== "playing") return;
    this.clearTimer();
    this.status = "paused";
    stopSpeech();
    this.notifyState();
  }

  public resume(): void {
    if (this.status !== "paused" || this.items.length === 0) return;
    this.status = "playing";
    this.speakCurrentStep();
  }

  public stop(): void {
    this.clearTimer();
    if (this.activeUtterance) {
      this.activeUtterance.onend = null;
      this.activeUtterance.onerror = null;
      this.activeUtterance = null;
    }
    this.status = "idle";
    this.currentRepetition = 1;
    this.isSpeakingArabic = false;
    stopSpeech();
    this.notifyState();
  }

  public getActiveUtterance(): SpeechSynthesisUtterance | null {
    return this.activeUtterance;
  }

  public nextWord(): void {
    if (this.currentIndex < this.items.length - 1) {
      this.currentIndex++;
      this.currentRepetition = 1;
      this.isSpeakingArabic = false;
      if (this.status === "playing") {
        this.clearTimer();
        stopSpeech();
        this.speakCurrentStep();
      } else {
        this.notifyState();
      }
    } else {
      this.complete();
    }
  }

  public previousWord(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.currentRepetition = 1;
      this.isSpeakingArabic = false;
      if (this.status === "playing") {
        this.clearTimer();
        stopSpeech();
        this.speakCurrentStep();
      } else {
        this.notifyState();
      }
    }
  }

  public replayWord(): void {
    this.currentRepetition = 1;
    this.isSpeakingArabic = false;
    if (this.status === "playing" || this.status === "paused") {
      this.status = "playing";
      this.clearTimer();
      stopSpeech();
      this.speakCurrentStep();
    } else {
      this.play(this.currentIndex);
    }
  }

  public jumpToWord(index: number): void {
    if (index >= 0 && index < this.items.length) {
      this.currentIndex = index;
      this.currentRepetition = 1;
      this.isSpeakingArabic = false;
      this.status = "playing";
      this.clearTimer();
      stopSpeech();
      this.speakCurrentStep();
    }
  }

  public getState(): PlayerState {
    return {
      status: this.status,
      currentIndex: this.currentIndex,
      totalWords: this.items.length,
      currentRepetition: this.currentRepetition,
      isSpeakingArabic: this.isSpeakingArabic,
      repetitions: this.repetitions,
      speed: this.speed,
    };
  }

  private notifyState(): void {
    const currentItem = this.items[this.currentIndex];
    this.onStateChange(this.getState(), currentItem);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private complete(): void {
    this.clearTimer();
    this.status = "completed";
    this.isSpeakingArabic = false;
    this.currentRepetition = 1;
    stopSpeech();
    this.notifyState();
  }

  private speakCurrentStep(): void {
    if (this.status !== "playing") return;
    if (this.currentIndex >= this.items.length) {
      this.complete();
      return;
    }

    const currentItem = this.items[this.currentIndex];
    if (!currentItem) {
      this.complete();
      return;
    }

    // Always fetch fresh voices from the system right before speech
    let voices = this.getVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const liveVoices = window.speechSynthesis.getVoices();
      if (!voices.english) voices.english = chooseVoice(liveVoices, "english");
      if (!voices.arabic) voices.arabic = chooseVoice(liveVoices, "arabic");
    }

    this.notifyState();

    let textToSpeak = "";
    let voiceToUse: SpeechSynthesisVoice | undefined;
    let targetLang = "en-US";

    if (!this.isSpeakingArabic) {
      // Speak English word
      textToSpeak = currentItem.cleanWord;
      voiceToUse = voices.english;
      targetLang = voiceToUse ? voiceToUse.lang : "en-US";
    } else {
      // Speak Arabic meaning
      textToSpeak = currentItem.arabicMeaning;
      // If meaning is unknown or fallback, check language
      const isArabic = /[\u0600-\u06FF]/.test(textToSpeak);
      if (isArabic) {
        voiceToUse = voices.arabic;
        targetLang = voiceToUse ? voiceToUse.lang : "ar-EG";
      } else {
        voiceToUse = voices.english;
        targetLang = voiceToUse ? voiceToUse.lang : "en-US";
      }
    }

    stopSpeech();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (voiceToUse) {
      utterance.voice = voiceToUse;
      utterance.lang = voiceToUse.lang;
    } else {
      utterance.lang = targetLang;
    }

    utterance.rate = Math.max(0.6, Math.min(this.speed, 1.4));
    utterance.pitch = 1.0;

    // Retain reference on instance so WebKit does not garbage-collect it mid-speech
    this.activeUtterance = utterance;

    const handleEnd = () => {
      this.activeUtterance = null;
      if (this.status !== "playing") return;

      // Pause between repetitions (850ms) so each repetition is distinct and clear
      this.timer = window.setTimeout(() => {
        this.advanceStep();
      }, 850);
    };

    utterance.onend = handleEnd;
    utterance.onerror = () => {
      handleEnd();
    };

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.speak(utterance);
    } else {
      handleEnd();
    }
  }

  private advanceStep(): void {
    if (this.status !== "playing") return;

    if (!this.isSpeakingArabic) {
      if (this.currentRepetition < this.repetitions) {
        this.currentRepetition++;
      } else {
        // Switch to Arabic meaning
        this.isSpeakingArabic = true;
      }
    } else {
      // Finished Arabic meaning -> advance to next word
      if (this.currentIndex < this.items.length - 1) {
        this.currentIndex++;
        this.currentRepetition = 1;
        this.isSpeakingArabic = false;
      } else {
        this.complete();
        return;
      }
    }

    this.speakCurrentStep();
  }
}
