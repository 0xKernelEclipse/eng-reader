/**
 * Vocabulary Extraction & Cleaning Pipeline
 *
 * Responsibilities:
 * 1. Clean raw OCR output (normalize whitespace, Unicode, strip noisy characters)
 * 2. OCR error heuristics (fix common 0->o, 1->l inside words)
 * 3. Extract word tokens while preserving page order
 * 4. Deduplicate (first-seen order preserved)
 * 5. Filter stop-words in "learning_words" mode while keeping school vocabulary
 * 6. Attach offline Arabic meanings
 */

import { lookupWord } from "./dictionary.js";
import type { VocabularyItem, VocabularyMode } from "./types.js";

/** Common English function / grammatical words to filter in learning mode. */
const STOP_WORDS = new Set([
  "a", "an", "the",
  "and", "or", "but", "nor", "so", "yet",
  "in", "on", "at", "to", "for", "of", "with", "by", "from", "up", "about", "into", "over", "after",
  "is", "am", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "having",
  "do", "does", "did", "doing",
  "can", "could", "will", "would", "shall", "should", "may", "might", "must",
  "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
  "my", "your", "his", "their", "its",
  "this", "that", "these", "those",
  "not", "no", "if", "then", "than", "too", "very", "just",
  "as", "out", "off",
]);

/**
 * Clean OCR character confusion errors when digits are embedded in alphabetic text.
 * e.g., "env1ronment" -> "environment", "c0ld" -> "cold"
 */
function repairOcrNoise(token: string): string {
  // If the whole token is a number, leave it (will be filtered out later)
  if (/^\d+$/.test(token)) return token;

  // Replace digit 1 with 'l' or 'i' if surrounded by letters
  let repaired = token.replace(/([a-zA-Z])1([a-zA-Z])/g, "$1l$2");
  // Replace digit 0 with 'o' if surrounded by letters
  repaired = repaired.replace(/([a-zA-Z])0([a-zA-Z])/g, "$1o$2");
  // Replace digit 5 with 's' if inside letters
  repaired = repaired.replace(/([a-zA-Z])5([a-zA-Z])/g, "$1s$2");

  return repaired;
}

/**
 * Format a word nicely for display: e.g. "environment" -> "Environment"
 */
function formatDisplayWord(word: string): string {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Extract clean, deduplicated vocabulary items from raw OCR text.
 *
 * @param rawText Raw text string from Tesseract
 * @param mode "learning_words" (default: filters function words) or "all_words"
 * @param fallbackMeaning Fallback message if word not in offline dictionary
 */
export function extractVocabulary(
  rawText: string,
  mode: VocabularyMode = "learning_words",
  fallbackMeaning = "لم نجد معنى لهذه الكلمة",
): VocabularyItem[] {
  if (!rawText || !rawText.trim()) return [];

  // Normalize Unicode (e.g. curly quotes, ligatures)
  const normalized = rawText
    .normalize("NFKC")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[\u2010-\u2015]/g, "-");

  // Split on whitespace or non-word boundaries (keep hyphens and internal apostrophes)
  const rawTokens = normalized.split(/[\s\r\n]+/);

  const seenClean = new Set<string>();
  const vocabulary: VocabularyItem[] = [];

  for (const raw of rawTokens) {
    // Basic trim of surrounding punctuation (commas, periods, brackets, quotes, colons)
    let token = raw.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
    if (!token) continue;

    // Apply OCR character repair
    token = repairOcrNoise(token);

    // Filter out pure numbers, URLs, emails
    if (/^\d+$/.test(token)) continue;
    if (token.includes("http") || token.includes("@") || token.includes(".com")) continue;

    // Filter out words with numbers or strange symbols
    if (/[0-9_]/.test(token)) continue;

    // Strip possessives for lookup: e.g. "student's" -> "student"
    let cleanWord = token.toLowerCase();
    if (cleanWord.endsWith("'s")) {
      cleanWord = cleanWord.slice(0, -2);
    }

    // Minimum length check (ignore single letters except 'I' / 'a' in all_words mode)
    if (cleanWord.length < 2) continue;

    // Filter common stopwords in "learning_words" mode
    if (mode === "learning_words" && STOP_WORDS.has(cleanWord)) {
      continue;
    }

    // Deduplicate in first-seen order
    if (seenClean.has(cleanWord)) {
      continue;
    }
    seenClean.add(cleanWord);

    // Look up in offline English -> Arabic dictionary
    const dictResult = lookupWord(cleanWord);

    vocabulary.push({
      id: `vocab-${vocabulary.length + 1}`,
      word: formatDisplayWord(token),
      cleanWord: cleanWord,
      arabicMeaning: dictResult ? dictResult.primary : fallbackMeaning,
      allMeanings: dictResult ? dictResult.meanings : [],
      foundInDictionary: Boolean(dictResult),
      selected: true,
    });
  }

  return vocabulary;
}
