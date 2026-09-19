import type {
  Locale,
  Theme,
  VocabularyItem,
  VocabularyMode,
  UserPreferences,
} from "./types.js";

const LOCALE_KEY = "reader-language";
const THEME_KEY = "reader-theme";
const SPEED_KEY = "reader-speed";
const REPETITIONS_KEY = "reader-repetitions";
const VOCAB_MODE_KEY = "reader-vocab-mode";
const CACHED_WORDS_KEY = "reader-cached-words";
const CUSTOM_MEANINGS_KEY = "reader-custom-meanings";
const EN_VOICE_KEY = "reader-en-voice";
const AR_VOICE_KEY = "reader-ar-voice";

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Silently ignore private browsing or quota limitations
  }
}

export function readLocale(): Locale {
  const stored = safeGet(LOCALE_KEY);
  return stored === "ar" ? "ar" : "en";
}

export function saveLocale(locale: Locale): void {
  safeSet(LOCALE_KEY, locale);
}

export function readTheme(): Theme {
  const stored = safeGet(THEME_KEY);
  return stored === "light" ? "light" : "dark";
}

export function saveTheme(theme: Theme): void {
  safeSet(THEME_KEY, theme);
}

export function readSpeed(): number {
  const stored = safeGet(SPEED_KEY);
  const parsed = stored ? parseFloat(stored) : NaN;
  const allowed = [0.8, 0.9, 1.0, 1.1, 1.25];
  return allowed.includes(parsed) ? parsed : 1.0;
}

export function saveSpeed(speed: number): void {
  safeSet(SPEED_KEY, String(speed));
}

export function readRepetitions(): number {
  const stored = safeGet(REPETITIONS_KEY);
  const parsed = stored ? parseInt(stored, 10) : NaN;
  const allowed = [3, 4, 5];
  return allowed.includes(parsed) ? parsed : 3;
}

export function saveRepetitions(repetitions: number): void {
  safeSet(REPETITIONS_KEY, String(repetitions));
}

export function readVocabMode(): VocabularyMode {
  const stored = safeGet(VOCAB_MODE_KEY);
  return stored === "all_words" ? "all_words" : "learning_words";
}

export function saveVocabMode(mode: VocabularyMode): void {
  safeSet(VOCAB_MODE_KEY, mode);
}

export function readPreferredVoiceUri(language: "english" | "arabic"): string | null {
  return safeGet(language === "english" ? EN_VOICE_KEY : AR_VOICE_KEY);
}

export function savePreferredVoiceUri(language: "english" | "arabic", uri: string): void {
  safeSet(language === "english" ? EN_VOICE_KEY : AR_VOICE_KEY, uri);
}

export function readCustomMeanings(): Record<string, string> {
  try {
    const raw = safeGet(CUSTOM_MEANINGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveCustomMeaning(word: string, meaning: string): void {
  try {
    const current = readCustomMeanings();
    current[word.trim().toLowerCase()] = meaning.trim();
    safeSet(CUSTOM_MEANINGS_KEY, JSON.stringify(current));
  } catch {
    // Best effort
  }
}

export function readUserPreferences(): UserPreferences {
  return {
    locale: readLocale(),
    theme: readTheme(),
    speed: readSpeed(),
    repetitions: readRepetitions(),
    vocabMode: readVocabMode(),
  };
}

export function saveCachedWords(words: VocabularyItem[]): void {
  try {
    safeSet(CACHED_WORDS_KEY, JSON.stringify(words));
  } catch {
    // Best effort
  }
}

export function readCachedWords(): VocabularyItem[] {
  try {
    const raw = safeGet(CACHED_WORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
