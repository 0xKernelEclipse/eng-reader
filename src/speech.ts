import type { VoiceState } from "./types.js";

// ---------------------------------------------------------------------------
// Voice selection
// ---------------------------------------------------------------------------

/**
 * Pick the best available voice for a given language by iterating preferred
 * BCP-47 tags in order.  Falls back to any voice whose lang starts with the
 * language root (e.g. "ar" matches "ar-SA").
 */
export function chooseVoice(
  available: SpeechSynthesisVoice[],
  language: "english" | "arabic",
): SpeechSynthesisVoice | undefined {
  const preferred =
    language === "english" ? ["en-US", "en-GB", "en"] : ["ar-EG", "ar-SA", "ar"];

  for (const tag of preferred) {
    const exact = available.find(
      (v) => v.lang.toLowerCase() === tag.toLowerCase(),
    );
    if (exact) return exact;
  }

  // Loose prefix match — handles tags like "en_US" (some Android engines)
  const root = language === "english" ? "en" : "ar";
  return available.find((v) => v.lang.toLowerCase().startsWith(root));
}

/**
 * Build a human-readable description of the found (or absent) voice, including
 * whether it is a locally-installed voice that will work offline.
 */
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

/**
 * Query the speech synthesis engine and return the best available voices.
 * Must be called again inside the `voiceschanged` event because some browsers
 * (including Safari) load voices asynchronously.
 */
export function getVoiceState(): VoiceState {
  if (typeof window.speechSynthesis === "undefined") return {};
  const available = window.speechSynthesis.getVoices();
  return {
    english: chooseVoice(available, "english"),
    arabic: chooseVoice(available, "arabic"),
  };
}

// ---------------------------------------------------------------------------
// Speech playback
// ---------------------------------------------------------------------------

/**
 * Speak a single utterance, cancelling any currently active speech first.
 * Returns without side-effects when the API is unavailable.
 */
export function speak(
  text: string,
  voice: SpeechSynthesisVoice | undefined,
  rate = 0.75,
): void {
  const synth = (window as Window & { speechSynthesis?: SpeechSynthesis })
    .speechSynthesis;
  if (!synth) return;
  if (!voice) return;

  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = rate;
  synth.speak(utterance);
}

export function stopSpeech(): void {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // Ignore — some environments don't support this
  }
}
