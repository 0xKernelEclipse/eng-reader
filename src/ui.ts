import type {
  Locale,
  Theme,
  VoiceState,
  PlayerState,
  VocabularyItem,
} from "./types.js";
import { describeVoice } from "./speech.js";
import { OCR_ASSET_PATHS } from "./ocr.js";

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------

export const translations: Record<Locale, Record<string, string>> = {
  en: {
    app_name: "English Reader",
    compatibility_label: "Vocabulary Learning Reader",
    headline: "Photograph the Page & Listen to Words",
    intro: "Take a photo of an English textbook page. The app reads and repeats each word 3 times in English, followed by its Arabic meaning.",

    // Steps
    step1_title: "1. Choose a Page Photo",
    step1_copy: "Take a photo of an English textbook or select a saved image.",
    take_photo: "Take a Photo",
    choose_photo: "Choose a Photo",
    try_sample: "Try Sample Page",
    image_idle: "No photo selected yet.",
    image_selected: "Photo selected: {name}",
    camera_photo: "Camera Photo",
    sample_loaded: "Sample textbook page loaded.",

    // Crop
    crop_title: "Crop Your Image",
    crop_copy: "Select only the part you want to read. Drag rectangle or tap points for polygon.",

    // OCR & Vocabulary
    step2_title: "2. Extract Vocabulary",
    step2_copy: "Reads text completely on-device without internet access.",
    start_ocr: "Start Reading & Extracting Words",
    ocr_idle: "Please choose an image first.",
    preparing_image: "Preparing & enhancing image contrast…",
    loading_ocr: "Starting local OCR engine…",
    ocr_progress: "Reading: {percent}%",
    ocr_failed: "Could not read this photo. Try taking a clearer, well-lit picture.",
    ocr_empty: "OCR finished, but no clear English words were found.",
    words_found: "Found {count} vocabulary words ready to learn!",

    // Player
    step3_title: "3. Listen & Repeat",
    step3_copy: "Speaks each English word 3 times, then its Arabic meaning automatically.",
    current_word_label: "Current Word",
    word_counter: "Word {current} of {total}",
    play: "Start Reading",
    resume: "Resume",
    pause: "Pause",
    stop: "Stop",
    next_word: "Next",
    prev_word: "Previous",
    replay_word: "Replay",
    step_en: "English {num}",
    step_ar: "Arabic",
    player_idle: "Tap 'Start Reading' to begin speech playback.",
    player_completed: "Great job! Finished reading all words from this page.",
    tap_to_listen: "Tap any word to listen to it directly",

    // Word List
    words_list_title: "Extracted Vocabulary ({count})",
    no_meaning: "Meaning not available",
    empty_list_notice: "No words yet. Take a photo of a textbook page to begin.",
    edit_meaning: "Edit Meaning",
    prompt_enter_meaning: "Enter Arabic meaning for",

    // Settings & Diagnostics Toggle
    settings_toggle: "Settings & Diagnostics",
    settings_title: "Reading Settings",
    speed_label: "Voice Speed:",
    repetitions_label: "Word Repetitions:",
    vocab_mode_label: "Vocabulary Extraction Mode:",
    mode_learning: "Important Lesson Words (Recommended)",
    mode_all: "All Extracted Words",
    english_voice_select: "English Voice:",
    arabic_voice_select: "Arabic Voice:",
    times: "times",

    // Diagnostics
    diagnostics_title: "Device & iPhone Compatibility Diagnostics",
    test_english: "Test English",
    test_arabic: "Test Arabic",
    stop_audio: "Stop Audio",
    english_voice: "English Voice",
    arabic_voice: "Arabic Voice",
    offline_title: "Offline Readiness Status",
    service_worker: "Service Worker",
    browser: "Browser",
    indexeddb: "IndexedDB",
    ocr_version: "OCR Engine Version",
    ocr_worker: "Web Worker File",
    ocr_core: "WebAssembly Core",
    ocr_language: "English Model",
    refresh: "Refresh Check",
    raw_ocr_label: "Raw Text Read by Engine",

    // Status Messages
    switch_light: "Use Light Theme",
    switch_dark: "Use Dark Theme",
    switch_ar: "Switch to Arabic",
    switch_en: "Switch to English",
    no_english_voice: "No English voice is available on this device.",
    no_arabic_voice: "No Arabic voice is available on this device.",
    local: "Local (works offline)",
    online_voice: "May require internet",
    speech_unavailable: "Speech is not supported in this browser.",
    image_only: "Please choose an image file.",
    storage_unavailable: "Offline storage is not available in this browser.",
    unavailable: "Unavailable",
    sw_ready: "Ready & Active",
    sw_installing: "Installing — please reopen the page.",
    available: "Available",
    cached: "Locally Cached ✓",
    not_cached: "Not Cached",
    offline_ready: "Ready for offline use: all required files are stored.",
    offline_wait: "Storage in progress. Keep page open with internet, then refresh.",
    sw_failed: "Could not register Service Worker.",

    // How-to guide
    how_to_title: "How to Install & Use on iPhone",
    how_to_1: "Open the site in Safari while online and wait until offline files are cached.",
    how_to_2: "Tap the Safari Share button and choose 'Add to Home Screen'.",
    how_to_3: "Close Safari, open the app from your home screen, and use it freely even offline!",
  },

  ar: {
    app_name: "قارئ الإنجليزية",
    compatibility_label: "قارئ المفردات التعليمي",
    headline: "التقط صورة واسمع الكلمات",
    intro: "التقط صورة لأي صفحة إنجليزية، وسيقوم التطبيق بقراءة الكلمات وتكرارها 3 مرات بالإنجليزية ثم معناها بالعربية.",

    // Steps
    step1_title: "1. اختر صورة الصفحة",
    step1_copy: "التقط صورة لصفحة كتاب أو اختر صورة محفوظة.",
    take_photo: "التقط صورة",
    choose_photo: "اختر صورة",
    try_sample: "صفحة تدريبية",
    image_idle: "لم يتم اختيار صورة بعد.",
    image_selected: "تم اختيار الصورة بنجاح: {name}",
    camera_photo: "صورة الكاميرا",
    sample_loaded: "تم تحميل الصفحة التدريبية النموذجية.",

    // Crop
    crop_title: "قص الصورة",
    crop_copy: "حدد فقط الجزء الذي تريد قراءته. اسحب مستطيلاً أو انقر نقاطاً للمضلع.",

    // OCR & Vocabulary
    step2_title: "2. استخراج الكلمات",
    step2_copy: "قراءة النص محليًا داخل الهاتف دون اتصال بالإنترنت.",
    start_ocr: "ابدأ قراءة واستخراج الكلمات",
    ocr_idle: "اختر صورة أولاً.",
    preparing_image: "جارٍ تجهيز وتحسين وضوح الصورة…",
    loading_ocr: "جارٍ تشغيل محرك القراءة المحلي…",
    ocr_progress: "جارٍ القراءة: {percent}٪",
    ocr_failed: "لم نتمكن من قراءة الصورة. جرّب التقاط صورة أكثر وضوحًا وإضاءة.",
    ocr_empty: "اكتمل الفحص، لكن لم يُعثر على كلمات إنجليزية واضحة.",
    words_found: "تم العثور على {count} كلمة جاهزة للاستماع!",

    // Player
    step3_title: "3. الاستماع والتكرار",
    step3_copy: "ينطق الكلمة الإنجليزية 3 مرات ثم المعنى بالعربية تلقائيًا.",
    current_word_label: "الكلمة الحالية",
    word_counter: "الكلمة {current} من {total}",
    play: "ابدأ القراءة",
    resume: "استئناف",
    pause: "إيقاف مؤقت",
    stop: "إيقاف",
    next_word: "التالية",
    prev_word: "السابقة",
    replay_word: "إعادة الكلمة",
    step_en: "إنجليزية {num}",
    step_ar: "العربية",
    player_idle: "اضغط «ابدأ القراءة» لبدء نطق الكلمات.",
    player_completed: "تم الانتهاء من قراءة جميع كلمات الصفحة.",
    tap_to_listen: "اضغط على أي كلمة للاستماع إليها مباشرة",

    // Word List
    words_list_title: "قائمة الكلمات المستخرجة ({count})",
    no_meaning: "لم نجد معنى محفوظًا",
    empty_list_notice: "لا توجد كلمات بعد. التقط صورة لصفحة كتاب للبدء.",
    edit_meaning: "تعديل المعنى",
    prompt_enter_meaning: "أدخل المعنى العربي لكلمة",

    // Settings & Diagnostics Toggle
    settings_toggle: "الإعدادات والفحص",
    settings_title: "إعدادات القراءة",
    speed_label: "سرعة الصوت:",
    repetitions_label: "عدد مرات تكرار الكلمة:",
    vocab_mode_label: "نوع استخراج الكلمات:",
    mode_learning: "كلمات الدروس المهمة (موصى به)",
    mode_all: "جميع الكلمات المستخرجة",
    english_voice_select: "صوت الإنجليزية:",
    arabic_voice_select: "صوت العربية:",
    times: "مرات",

    // Diagnostics
    diagnostics_title: "فحص الجهاز والتوافق مع الهاتف",
    test_english: "اختبار الإنجليزية",
    test_arabic: "اختبار العربية",
    stop_audio: "إيقاف الصوت",
    english_voice: "صوت الإنجليزية",
    arabic_voice: "صوت العربية",
    offline_title: "حالة العمل دون إنترنت",
    service_worker: "Service Worker",
    browser: "المتصفح",
    indexeddb: "IndexedDB",
    ocr_version: "إصدار محرك القراءة",
    ocr_worker: "ملف Web Worker",
    ocr_core: "نواة WebAssembly",
    ocr_language: "نموذج اللغة الإنجليزية",
    refresh: "تحديث الفحص",
    raw_ocr_label: "النص الخام الذي قرأه المحرك",

    // Status Messages
    switch_light: "تفعيل المظهر الفاتح",
    switch_dark: "تفعيل المظهر الداكن",
    switch_ar: "التبديل إلى العربية",
    switch_en: "Switch to English",
    no_english_voice: "لا يتوفر صوت إنجليزي على هذا الجهاز.",
    no_arabic_voice: "لا يتوفر صوت عربي على هذا الجهاز.",
    local: "محلي ويعمل دون إنترنت",
    online_voice: "قد يحتاج إنترنت",
    speech_unavailable: "الصوت غير مدعوم في هذا المتصفح.",
    image_only: "يرجى اختيار ملف صورة فقط.",
    storage_unavailable: "التخزين دون إنترنت غير متاح في هذا المتصفح.",
    unavailable: "غير متاح",
    sw_ready: "جاهز ومفعّل",
    sw_installing: "قيد التثبيت — يُرجى إعادة فتح الصفحة.",
    available: "متاح",
    cached: "مخزّن محليًا ✓",
    not_cached: "غير مخزّن",
    offline_ready: "جاهز للعمل دون إنترنت: تم تخزين جميع الملفات المطلوبة بنجاح.",
    offline_wait: "التخزين لم يكتمل بعد. اترك الصفحة مفتوحة مع الاتصال بالإنترنت ثم حدّث الفحص.",
    sw_failed: "تعذّر تسجيل Service Worker.",

    // How-to guide
    how_to_title: "طريقة الاستخدام والتثبيت على iPhone",
    how_to_1: "افتح الموقع في Safari أثناء الاتصال بالإنترنت وانتظر حتى تكتمل الملفات.",
    how_to_2: "اضغط زر المشاركة (Share) في Safari واختر «إضافة إلى الشاشة الرئيسية» (Add to Home Screen).",
    how_to_3: "أغلق المتصفح، ثم افتح التطبيق من أيقونة الشاشة الرئيسية واستخدمه بحرية حتى دون إنترنت!",
  },
};

// ---------------------------------------------------------------------------
// DOM Helpers
// ---------------------------------------------------------------------------

export function req<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing required element: #${id}`);
  return el as T;
}

function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(`{${k}}`, String(v)),
    template,
  );
}

export function t(
  locale: Locale,
  key: string,
  vars: Record<string, string | number> = {},
): string {
  const template = translations[locale][key] ?? translations["en"][key] ?? key;
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
// Theme & Locale Rendering
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
    locale === "ar" ? "قارئ الكلمات الإنجليزية" : "English Vocabulary Reader";

  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((node) => {
    const key = node.dataset["i18n"];
    if (key) node.textContent = t(locale, key);
  });

  document
    .querySelectorAll<HTMLTextAreaElement>("[data-i18n-placeholder]")
    .forEach((node) => {
      const key = node.dataset["i18nPlaceholder"];
      if (key) node.placeholder = t(locale, key);
    });

  const langBtn = req<HTMLButtonElement>("language-toggle");
  langBtn.textContent = locale === "ar" ? "EN" : "عربي";
  langBtn.setAttribute(
    "aria-label",
    t(locale, locale === "ar" ? "switch_en" : "switch_ar"),
  );
}

// ---------------------------------------------------------------------------
// Voice Status Rendering
// ---------------------------------------------------------------------------

export function renderVoiceStatus(locale: Locale, voices: VoiceState): void {
  const translate = (key: string) => t(locale, key);
  const enStatus = document.getElementById("english-voice");
  const arStatus = document.getElementById("arabic-voice");

  if (enStatus) {
    showStatus(
      enStatus,
      describeVoice(voices.english, "english", translate),
      voices.english ? "success" : "error",
    );
  }

  if (arStatus) {
    showStatus(
      arStatus,
      describeVoice(voices.arabic, "arabic", translate),
      voices.arabic ? "success" : "error",
    );
  }
}

// ---------------------------------------------------------------------------
// Player Display Rendering
// ---------------------------------------------------------------------------

export function renderPlayerUI(
  state: PlayerState,
  currentItem: VocabularyItem | undefined,
  locale: Locale,
): void {
  const playerCard = document.getElementById("player-card");
  if (!playerCard) return;

  const currentWordEl = req<HTMLElement>("player-current-word");
  const arabicMeaningEl = req<HTMLElement>("player-arabic-meaning");
  const counterEl = req<HTMLElement>("player-counter");
  const playPauseBtn = req<HTMLButtonElement>("player-play-pause");
  const playPauseText = req<HTMLElement>("player-play-pause-text");
  const stepsContainer = req<HTMLElement>("player-steps");

  if (!currentItem || state.totalWords === 0) {
    currentWordEl.textContent = "—";
    arabicMeaningEl.textContent = t(locale, "player_idle");
    counterEl.textContent = "";
    playPauseBtn.disabled = true;
    stepsContainer.innerHTML = "";
    return;
  }

  playPauseBtn.disabled = false;
  currentWordEl.textContent = currentItem.word;
  arabicMeaningEl.textContent = currentItem.arabicMeaning;
  counterEl.textContent = t(locale, "word_counter", {
    current: state.currentIndex + 1,
    total: state.totalWords,
  });

  // Update Play / Pause button state
  if (state.status === "playing") {
    playPauseText.textContent = t(locale, "pause");
    playPauseBtn.setAttribute("data-action", "pause");
  } else if (state.status === "paused") {
    playPauseText.textContent = t(locale, "resume");
    playPauseBtn.setAttribute("data-action", "resume");
  } else if (state.status === "completed") {
    playPauseText.textContent = t(locale, "play");
    playPauseBtn.setAttribute("data-action", "play");
    arabicMeaningEl.textContent = t(locale, "player_completed");
  } else {
    playPauseText.textContent = t(locale, "play");
    playPauseBtn.setAttribute("data-action", "play");
  }

  // Render repetition step pills
  let stepsHtml = "";
  for (let r = 1; r <= state.repetitions; r++) {
    const isCurrent =
      state.status === "playing" &&
      !state.isSpeakingArabic &&
      state.currentRepetition === r;
    const isDone =
      (state.status === "playing" && state.currentRepetition > r) ||
      state.isSpeakingArabic;
    const cls = isCurrent ? "step-pill active" : isDone ? "step-pill done" : "step-pill";
    stepsHtml += `<span class="${cls}">${t(locale, "step_en", { num: r })}</span>`;
  }

  const arCurrent = state.status === "playing" && state.isSpeakingArabic;
  const arCls = arCurrent ? "step-pill active arabic-pill" : "step-pill arabic-pill";
  stepsHtml += `<span class="${arCls}">${t(locale, "step_ar")}</span>`;

  stepsContainer.innerHTML = stepsHtml;

  // Highlight active word in the vocabulary list
  document.querySelectorAll(".vocab-row").forEach((row, idx) => {
    if (idx === state.currentIndex) {
      row.classList.add("active-row");
      row.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      row.classList.remove("active-row");
    }
  });
}

// ---------------------------------------------------------------------------
// Word List Rendering
// ---------------------------------------------------------------------------

export function renderWordList(
  words: VocabularyItem[],
  currentIndex: number,
  locale: Locale,
  onSelectWord: (index: number) => void,
  onToggleCheckbox?: (index: number, checked: boolean) => void,
): void {
  const container = document.getElementById("words-list-container");
  const countBadge = document.getElementById("words-count-badge");
  if (!container) return;

  if (countBadge) {
    countBadge.textContent = String(words.length);
  }

  if (words.length === 0) {
    container.innerHTML = `<p class="empty-list-notice">${t(locale, "empty_list_notice")}</p>`;
    return;
  }

  container.innerHTML = words
    .map(
      (item, idx) => `
    <div class="vocab-row ${idx === currentIndex ? "active-row" : ""} ${item.selected ? "" : "is-unselected"}" data-index="${idx}">
      <label class="vocab-check-wrap" title="Include in repeating queue">
        <input type="checkbox" class="vocab-checkbox" data-index="${idx}" ${item.selected ? "checked" : ""} />
        <span class="vocab-custom-check" aria-hidden="true"></span>
      </label>
      <button type="button" class="vocab-row-main" data-index="${idx}">
        <span class="vocab-index">${idx + 1}</span>
        <div class="vocab-details">
          <span class="vocab-en">${item.word}${item.isCustom ? ' <span class="custom-word-pill">Added</span>' : ""}</span>
          <span class="vocab-ar">${item.arabicMeaning}</span>
        </div>
        <span class="vocab-play-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </span>
      </button>
    </div>
  `,
    )
    .join("");

  container.querySelectorAll<HTMLButtonElement>(".vocab-row-main").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset["index"] || "0", 10);
      onSelectWord(idx);
    });
  });

  container.querySelectorAll<HTMLInputElement>(".vocab-checkbox").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      e.stopPropagation();
      const idx = parseInt(cb.dataset["index"] || "0", 10);
      const isChecked = cb.checked;
      const row = cb.closest(".vocab-row");
      if (row) {
        row.classList.toggle("is-unselected", !isChecked);
      }
      onToggleCheckbox?.(idx, isChecked);
    });
  });
}

// ---------------------------------------------------------------------------
// Offline Diagnostics
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

  const browserStatus = document.getElementById("browser-status");
  const indexedDbStatus = document.getElementById("indexeddb-status");
  const swStatus = document.getElementById("sw-status");
  const offlineStatus = document.getElementById("offline-status");
  const workerCache = document.getElementById("worker-cache");
  const coreCache = document.getElementById("core-cache");
  const languageCache = document.getElementById("language-cache");

  if (browserStatus) showStatus(browserStatus, navigator.userAgent);

  const hasIndexedDb = "indexedDB" in window;
  if (indexedDbStatus) {
    showStatus(
      indexedDbStatus,
      hasIndexedDb ? translate("available") : translate("unavailable"),
      hasIndexedDb ? "success" : "error",
    );
  }

  if (!("serviceWorker" in navigator) || !("caches" in window)) {
    if (offlineStatus) showStatus(offlineStatus, translate("storage_unavailable"), "error");
    if (swStatus) showStatus(swStatus, translate("unavailable"), "error");
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  const swActive = Boolean(registration?.active);
  if (swStatus) {
    showStatus(
      swStatus,
      swActive ? translate("sw_ready") : translate("sw_installing"),
      swActive ? "success" : "normal",
    );
  }

  const [workerOk, coreOk, langOk] = await Promise.all(
    OCR_ASSET_PATHS.map(isCached),
  );

  if (workerCache) {
    showStatus(
      workerCache,
      workerOk ? translate("cached") : translate("not_cached"),
      workerOk ? "success" : "error",
    );
  }
  if (coreCache) {
    showStatus(
      coreCache,
      coreOk ? translate("cached") : translate("not_cached"),
      coreOk ? "success" : "error",
    );
  }
  if (languageCache) {
    showStatus(
      languageCache,
      langOk ? translate("cached") : translate("not_cached"),
      langOk ? "success" : "error",
    );
  }

  const allReady = swActive && workerOk && coreOk && langOk;
  if (offlineStatus) {
    showStatus(
      offlineStatus,
      allReady ? translate("offline_ready") : translate("offline_wait"),
      allReady ? "success" : "normal",
    );
  }
}
