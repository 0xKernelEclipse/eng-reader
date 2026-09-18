import type { Locale, Theme } from "./types.js";

const LOCALE_KEY = "reader-language";
const THEME_KEY = "reader-theme";

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // Private-browsing mode can throw
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Silently ignore — settings are best-effort
  }
}

export function readLocale(): Locale {
  const stored = safeGet(LOCALE_KEY);
  return stored === "en" ? "en" : "ar"; // default = Arabic
}

export function saveLocale(locale: Locale): void {
  safeSet(LOCALE_KEY, locale);
}

export function readTheme(): Theme {
  const stored = safeGet(THEME_KEY);
  return stored === "light" ? "light" : "dark"; // default = dark
}

export function saveTheme(theme: Theme): void {
  safeSet(THEME_KEY, theme);
}
