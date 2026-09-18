import type { Locale, Theme, VoiceState } from "./types.js";
import { describeVoice } from "./speech.js";
import { OCR_ASSET_PATHS } from "./ocr.js";

// ---------------------------------------------------------------------------
// i18n strings
// ---------------------------------------------------------------------------

export const translations: Record<Locale, Record<string, string>> = {
  ar: {
    app_name: "قارئ الإنجليزية",
    compatibility_label: "اختبار التوافق",
    headline: "اختبار بسيط قبل البدء",
    intro: "نتأكد من الكاميرا وقراءة الصورة والصوت والعمل دون إنترنت.",

    photo_title: "اختاري صورة الصفحة",
    photo_copy: "صوّري صفحة إنجليزية أو اختاري صورة محفوظة.",
    take_photo: "صوّري الصفحة",
    choose_photo: "اختاري صورة",
    image_idle: "لم يتم اختيار صورة بعد.",

    ocr_title: "اقرئي النص من الصورة",
    ocr_copy: "يعمل محرك القراءة على الهاتف، ولا تُرسل الصورة إلى أي مكان.",
    start_ocr: "ابدئي قراءة الصورة",
    ocr_idle: "اختاري صورة أولاً.",
    ocr_result_label: "النص الذي قرأه التطبيق",
    ocr_placeholder: "سيظهر النص هنا بعد الاختبار.",

    speech_title: "اختبري الأصوات",
    speech_copy: "اضغطي الزر لسماع كل لغة من أصوات الهاتف المتاحة.",
    test_english: "اختبار الإنجليزية",
    test_arabic: "اختبار العربية",
    stop_audio: "إيقاف الصوت",
    english_voice: "صوت الإنجليزية",
    arabic_voice: "صوت العربية",

    offline_title: "العمل دون إنترنت",
    offline_copy: "تظهر علامة الجاهزية فقط بعد حفظ ملفات القراءة محليًا.",
    offline_idle: "جارٍ فحص الملفات المحلية…",
    service_worker: "Service Worker",
    browser: "المتصفح",
    indexeddb: "IndexedDB",
    ocr_version: "إصدار OCR",
    ocr_worker: "ملف OCR worker",
    ocr_core: "نواة OCR",
    ocr_language: "نموذج الإنجليزية",
    refresh: "تحديث الفحص",

    switch_to_en: "EN",
    switch_to_ar: "ع",
    switch_light: "تفعيل المظهر الفاتح",
    switch_dark: "تفعيل المظهر الداكن",

    no_english_voice: "لا يتوفر صوت إنجليزي على هذا الجهاز.",
    no_arabic_voice: "لا يتوفر صوت عربي على هذا الجهاز.",
    local: "محلي",
    online_voice: "قد يحتاج إنترنت",
    speech_unavailable: "الصوت غير متاح في هذا المتصفح.",
    requested_voice_unavailable: "الصوت المطلوب غير متاح على هذا الجهاز.",

    image_only: "اختاري ملف صورة فقط.",
    image_selected: "تم اختيار الصورة: {name}.",
    camera_photo: "صورة الكاميرا",
    image_ready: "الصورة جاهزة. ابدئي اختبار القراءة.",
    preparing_image: "جارٍ تجهيز الصورة…",
    loading_ocr: "جارٍ تحميل محرك القراءة المحلي…",
    ocr_progress: "جارٍ {status}: {percent}٪",
    ocr_success: "نجح اختبار قراءة النص المحلي.",
    ocr_empty: "اكتمل الاختبار، لكن لم يُعثر على نص واضح.",
    ocr_failed: "لم نتمكن من قراءة الصورة. جرّبي صورة أوضح.",

    storage_unavailable: "التخزين دون إنترنت غير متاح في هذا المتصفح.",
    unavailable: "غير متاح",
    sw_ready: "جاهز",
    sw_installing: "قيد التثبيت — أعيدي فتح الصفحة مرة واحدة.",
    available: "متاح",
    cached: "مخزّن ✓",
    not_cached: "غير مخزّن",
    offline_ready: "جاهز للعمل دون إنترنت: تم تخزين ملفات الاختبار الأساسية.",
    offline_wait:
      "التخزين لم يكتمل بعد. اتركي الصفحة مفتوحة مع الإنترنت ثم حدّثي الفحص.",
    sw_failed: "تعذّر تثبيت Service Worker.",

    how_to_title: "طريقة الاختبار على الهاتف",
    how_to_1: "افتحي الصفحة مع الإنترنت، وانتظري حتى تظهر حالة الملفات مكتملة.",
    how_to_2: "من زر المشاركة في Safari اختاري «إضافة إلى الشاشة الرئيسية».",
    how_to_3: "أغلقي Safari، أوقفي Wi-Fi والبيانات، وافتحي التطبيق من الأيقونة.",
  },

  en: {
    app_name: "English Reader",
    compatibility_label: "COMPATIBILITY TEST",
    headline: "A simple test before we begin",
    intro: "We check the camera, image reading, speech, and offline use.",

    photo_title: "Choose a page photo",
    photo_copy:
      "Take a photo of an English page or choose one already saved.",
    take_photo: "Take a photo",
    choose_photo: "Choose a photo",
    image_idle: "No photo selected yet.",

    ocr_title: "Read the text in the photo",
    ocr_copy: "The reader runs on the phone. Your photo is not sent anywhere.",
    start_ocr: "Start reading the photo",
    ocr_idle: "Choose a photo first.",
    ocr_result_label: "Text read by the app",
    ocr_placeholder: "Text will appear here after the test.",

    speech_title: "Test the voices",
    speech_copy: "Tap a button to hear each available phone voice.",
    test_english: "Test English",
    test_arabic: "Test Arabic",
    stop_audio: "Stop audio",
    english_voice: "English voice",
    arabic_voice: "Arabic voice",

    offline_title: "Work offline",
    offline_copy:
      "The ready mark appears only after the reader files are saved locally.",
    offline_idle: "Checking local files…",
    service_worker: "Service Worker",
    browser: "Browser",
    indexeddb: "IndexedDB",
    ocr_version: "OCR version",
    ocr_worker: "OCR worker",
    ocr_core: "OCR core",
    ocr_language: "English model",
    refresh: "Refresh check",

    switch_to_en: "EN",
    switch_to_ar: "ع",
    switch_light: "Use light theme",
    switch_dark: "Use dark theme",

    no_english_voice: "No English voice is available on this device.",
    no_arabic_voice: "No Arabic voice is available on this device.",
    local: "local",
    online_voice: "may need internet",
    speech_unavailable: "Speech is not available in this browser.",
    requested_voice_unavailable:
      "The requested voice is not available on this device.",

    image_only: "Please choose an image file.",
    image_selected: "Photo selected: {name}.",
    camera_photo: "Camera photo",
    image_ready: "Your photo is ready. Start the reading test.",
    preparing_image: "Preparing the photo…",
    loading_ocr: "Loading the local reading engine…",
    ocr_progress: "{status}: {percent}%",
    ocr_success: "The local text-reading test passed.",
    ocr_empty: "The test completed, but no clear text was found.",
    ocr_failed: "We could not read this photo. Try a clearer one.",

    storage_unavailable: "Offline storage is unavailable in this browser.",
    unavailable: "Unavailable",
    sw_ready: "Ready",
    sw_installing: "Installing — reopen the page once.",
    available: "Available",
    cached: "Cached ✓",
    not_cached: "Not cached",
    offline_ready: "Ready for offline use: core files are saved.",
    offline_wait:
      "Storage is not complete yet. Keep this page open with internet, then refresh.",
    sw_failed: "The Service Worker could not be installed.",

    how_to_title: "How to test on your phone",
    how_to_1:
      "Open the page with internet and wait until files show as complete.",
    how_to_2: "In Safari tap the Share button → \"Add to Home Screen\".",
    how_to_3:
      "Close Safari, turn off Wi-Fi and data, open the app from the icon.",
  },
};

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function req<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing required element: #${id}`);
  return el as T;
}

/** Replace `{key}` tokens in a template string. */
function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(`{${k}}`, String(v)),
    template,
  );
}

/** Translate a key for the current locale with optional variable interpolation. */
export function t(
  locale: Locale,
  key: string,
  vars: Record<string, string | number> = {},
): string {
  const template = translations[locale][key] ?? key;
  return interpolate(template, vars);
}

export function showStatus(
  target: HTMLElement,
  message: string,
  kind: "normal" | "success" | "error" = "normal",
): void {
  target.textContent = message;
  target.dataset["kind"] = kind;
}

// ---------------------------------------------------------------------------
// Render functions
// ---------------------------------------------------------------------------

export function renderTheme(theme: Theme): void {
  document.documentElement.className = `theme-${theme}`;
  const meta = document.querySelector<HTMLMetaElement>("meta[name='theme-color']");
  if (meta) meta.content = theme === "dark" ? "#090f1d" : "#edf3f8";
}

export function renderLocale(locale: Locale): void {
  const html = document.documentElement;
  html.lang = locale;
  html.dir = locale === "ar" ? "rtl" : "ltr";
  document.title =
    locale === "ar" ? "اختبار قارئ الإنجليزية" : "English Reader Test";

  // Translate all data-i18n text nodes
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((node) => {
    const key = node.dataset["i18n"];
    if (key) node.textContent = t(locale, key);
  });

  // Translate placeholder attributes
  document
    .querySelectorAll<HTMLTextAreaElement>("[data-i18n-placeholder]")
    .forEach((node) => {
      const key = node.dataset["i18nPlaceholder"];
      if (key) node.placeholder = t(locale, key);
    });

  // Update toggle buttons
  const langBtn = req<HTMLButtonElement>("language-toggle");
  langBtn.textContent = locale === "ar" ? "EN" : "ع";
  langBtn.setAttribute(
    "aria-label",
    locale === "ar" ? "Switch to English" : "التبديل إلى العربية",
  );
}

// ---------------------------------------------------------------------------
// Voice status display
// ---------------------------------------------------------------------------

export function renderVoiceStatus(
  locale: Locale,
  voices: VoiceState,
): void {
  const translate = (key: string) => t(locale, key);
  showStatus(
    req("english-voice"),
    describeVoice(voices.english, "english", translate),
    voices.english ? "success" : "error",
  );
  showStatus(
    req("arabic-voice"),
    describeVoice(voices.arabic, "arabic", translate),
    voices.arabic ? "success" : "error",
  );
}

// ---------------------------------------------------------------------------
// Offline diagnostics
// ---------------------------------------------------------------------------

async function isCached(path: string): Promise<boolean> {
  try {
    return Boolean(
      await caches.match(new URL(path, window.location.origin).toString()),
    );
  } catch {
    return false;
  }
}

export async function refreshOfflineDiagnostics(locale: Locale): Promise<void> {
  const translate = (key: string) => t(locale, key);

  const browserStatus = req("browser-status");
  const indexedDbStatus = req("indexeddb-status");
  const swStatus = req("sw-status");
  const offlineStatus = req("offline-status");
  const workerCache = req("worker-cache");
  const coreCache = req("core-cache");
  const languageCache = req("language-cache");

  showStatus(browserStatus, navigator.userAgent);

  const hasIndexedDb = "indexedDB" in window;
  showStatus(
    indexedDbStatus,
    hasIndexedDb ? translate("available") : translate("unavailable"),
    hasIndexedDb ? "success" : "error",
  );

  if (!("serviceWorker" in navigator) || !("caches" in window)) {
    showStatus(offlineStatus, translate("storage_unavailable"), "error");
    showStatus(swStatus, translate("unavailable"), "error");
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  const swActive = Boolean(registration?.active);
  showStatus(
    swStatus,
    swActive ? translate("sw_ready") : translate("sw_installing"),
    swActive ? "success" : "normal",
  );

  const [workerOk, coreOk, langOk] = await Promise.all(
    OCR_ASSET_PATHS.map(isCached),
  );

  showStatus(
    workerCache,
    workerOk ? translate("cached") : translate("not_cached"),
    workerOk ? "success" : "error",
  );
  showStatus(
    coreCache,
    coreOk ? translate("cached") : translate("not_cached"),
    coreOk ? "success" : "error",
  );
  showStatus(
    languageCache,
    langOk ? translate("cached") : translate("not_cached"),
    langOk ? "success" : "error",
  );

  const allReady = swActive && workerOk && coreOk && langOk;
  showStatus(
    offlineStatus,
    allReady ? translate("offline_ready") : translate("offline_wait"),
    allReady ? "success" : "normal",
  );
}
