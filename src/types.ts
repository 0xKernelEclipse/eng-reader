/** Supported UI languages. Arabic is the default. */
export type Locale = "ar" | "en";

/** Visual theme. Dark comes first. */
export type Theme = "dark" | "light";

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
  /** True when OCR returned output but it contained no useful words. */
  empty: boolean;
}
