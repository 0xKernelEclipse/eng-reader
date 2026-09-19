/** Supported UI languages. Arabic is the default. */
export type Locale = "ar" | "en";

/** Visual theme. Dark comes first. */
export type Theme = "dark" | "light";

/** Vocabulary extraction filtering mode. */
export type VocabularyMode = "learning_words" | "all_words";

/** Available speech synthesis voices for the two languages we need. */
export interface VoiceState {
  english?: SpeechSynthesisVoice;
  arabic?: SpeechSynthesisVoice;
}

/** Progress callback shape passed by Tesseract during recognition. */
export interface OcrProgressMessage {
  status: string;
  progress: number;
}

/** The result of a successful OCR run. */
export interface OcrResult {
  text: string;
  empty: boolean;
}

/** Single extracted vocabulary item with translations. */
export interface VocabularyItem {
  id: string;
  word: string;             // Display word (e.g. "Environment")
  cleanWord: string;        // Normalized word for lookup (e.g. "environment")
  arabicMeaning: string;    // Primary Arabic translation (e.g. "البيئة")
  allMeanings: string[];    // Additional meanings if available
  foundInDictionary: boolean;
  selected: boolean;        // Checkbox — whether this word is queued for reading
  isCustom?: boolean;       // True if manually added by user
}

/** Playback status for the speech queue. */
export type PlaybackStatus = "idle" | "playing" | "paused" | "completed";

/** Current active step in word repetition. */
export type RepetitionStep = {
  type: "en" | "ar";
  index: number;            // e.g. 1, 2, 3 for EN, 1 for AR
  text: string;
  lang: string;
};

/** Full state of vocabulary speech player. */
export interface PlayerState {
  status: PlaybackStatus;
  currentIndex: number;
  totalWords: number;
  currentRepetition: number; // 1..N for EN, then special step for AR
  isSpeakingArabic: boolean;
  repetitions: number;      // 3 (default), 4, 5
  speed: number;            // 0.6, 0.75 (default), 0.9, 1.0, 1.15
}

/** User preferences saved to local storage. */
export interface UserPreferences {
  locale: Locale;
  theme: Theme;
  speed: number;
  repetitions: number;
  vocabMode: VocabularyMode;
}
