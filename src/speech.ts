/**
 * Speech Synthesis & Vocabulary Audio Queue Engine
 *
 * Designed for older WebKit / Safari 15.8.8 and modern browsers:
 * - Robust queue management for repeating sequences: [English x N] -> [Arabic x 1]
 * - Retains active utterance reference to prevent Safari GC cutoffs
 * - Short inter-utterance pause (200ms) for natural cadence
 * - Full controls: play, pause, resume, stop, next, previous, replay, jump
 */

import type {
  PlayerState,
  PlaybackStatus,
  VocabularyItem,
  VoiceState,
} from "./types.js";

// ---------------------------------------------------------------------------
// Voice Selection & Diagnostics
// ---------------------------------------------------------------------------

export function chooseVoice(
  available: SpeechSynthesisVoice[],
  language: "english" | "arabic",
): SpeechSynthesisVoice | undefined {
  const preferred =
    language === "english"
      ? ["en-US", "en-GB", "en"]
      : ["ar-EG", "ar-SA", "ar"];

  for (const tag of preferred) {
    const exact = available.find(
      (v) => v.lang.toLowerCase() === tag.toLowerCase(),
    );
    if (exact) return exact;
  }

  const root = language === "english" ? "en" : "ar";
  return available.find((v) => v.lang.toLowerCase().startsWith(root));
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
  rate = 0.75,
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();

  testUtterance = new SpeechSynthesisUtterance(text);
  if (voice) {
    testUtterance.voice = voice;
    testUtterance.lang = voice.lang;
  }
  testUtterance.rate = rate;
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
  private speed = 0.75;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private timer: number | null = null;
  private onStateChange: StateChangeCallback;
  private getVoices: () => VoiceState;

  constructor(
    getVoices: () => VoiceState,
    onStateChange: StateChangeCallback,
    initialRepetitions = 3,
    initialSpeed = 0.75,
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

    const voices = this.getVoices();
    this.notifyState();

    let textToSpeak = "";
    let voiceToUse: SpeechSynthesisVoice | undefined;
    let lang = "en-US";

    if (!this.isSpeakingArabic) {
      // Speak English word
      textToSpeak = currentItem.cleanWord;
      voiceToUse = voices.english;
      lang = voiceToUse ? voiceToUse.lang : "en-US";
    } else {
      // Speak Arabic meaning
      textToSpeak = currentItem.arabicMeaning;
      voiceToUse = voices.arabic;
      lang = voiceToUse ? voiceToUse.lang : "ar-EG";
    }

    stopSpeech();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (voiceToUse) {
      utterance.voice = voiceToUse;
      utterance.lang = voiceToUse.lang;
    } else {
      utterance.lang = lang;
    }
    utterance.rate = this.speed;

    // Retain reference on instance so WebKit does not GC it
    this.activeUtterance = utterance;

    const handleEnd = () => {
      this.activeUtterance = null;
      if (this.status !== "playing") return;

      // Small pause between utterances (220ms) for natural cadence & Safari stability
      this.timer = window.setTimeout(() => {
        this.advanceStep();
      }, 220);
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
