/**
 * Offline English -> Arabic School Dictionary
 *
 * Designed for offline-first operation with:
 * - Curated standard/simple student Arabic meanings (Egyptian/standard friendly)
 * - Support for multiple meanings
 * - Smart morphology & lemmatization (plurals, tenses, possessives, irregulars)
 */

export interface DictionaryDefinition {
  primary: string;
  meanings: string[];
}

export type RawDictionaryEntry = string | string[] | { meanings: string[] };

/**
 * Curated core vocabulary database for school & textbook English.
 */
const DICTIONARY_DATABASE: Record<string, RawDictionaryEntry> = {
  // --- Textbook Sample & Environment Vocabulary ---
  environment: "البيئة",
  beautiful: "جميل",
  protect: "يحمي",
  dangerous: "خطير",
  pollution: "التلوث",
  student: "طالب",
  help: ["يساعد", "مساعدة"],
  clean: ["نظيف", "ينظف"],
  plant: "نبات",
  plants: "نباتات",
  tree: "شجرة",
  trees: "أشجار",
  fresh: "طازج ونقي",
  air: "هواء",
  day: "يوم",
  earth: "الأرض",
  water: "ماء",
  school: "مدرسة",
  teacher: "معلم",
  book: "كتاب",
  sentence: "جملة",
  read: "يقرأ",
  write: "يكتب",
  circle: ["دائرة", "يضع دائرة"],
  know: "يعرف",
  again: "مرة أخرى",
  important: "مهم",
  nature: "الطبيعة",
  animal: "حيوان",
  animals: "حيوانات",
  garbage: "قمامة",
  recycle: "يعيد تدوير",
  save: ["ينقذ", "يحفظ", "يوفر"],
  waste: ["يهدر", "نفايات"],
  river: "نهر",
  sea: "بحر",
  ocean: "محيط",
  sun: "شمس",
  moon: "قمر",
  sky: "سماء",
  cloud: "سحابة",
  rain: "مطر",
  wind: "رياح",
  forest: "غابة",
  green: "أخضر",
  blue: "أزرق",
  yellow: "أصفر",
  red: "أحمر",
  white: "أبيض",
  black: "أسود",

  // --- Common Classroom & Learning Vocabulary ---
  learn: "يتعلم",
  study: "يذاكر",
  lesson: "درس",
  pencil: "قلم رصاص",
  pen: "قلم جاف",
  eraser: "ممحاة",
  ruler: "مسطرة",
  bag: "حقيبة",
  desk: "مكتب",
  chair: "كرسي",
  classroom: "فصل دراسي",
  board: "سبورة",
  page: "صفحة",
  word: "كلمة",
  words: "كلمات",
  letter: ["حرف", "رسالة"],
  number: "رقم",
  question: "سؤال",
  answer: "إجابة",
  exercise: "تمرين",
  homework: "واجب منزلي",
  test: "اختبار",
  exam: "امتحان",
  grade: "درجة أو صف دراسي",
  class: "فصل",
  listen: "يستمع",
  speak: "يتحدث",
  talk: "يتكلم",
  look: "ينظر",
  see: "يرى",
  watch: "يشاهد",
  hear: "يسمع",
  repeat: "يكرر",
  understand: "يفهم",
  remember: "يتذكر",
  forget: "ينسى",
  think: "يفكر",
  choose: "يختار",
  find: "يجد",
  match: "يطابق",
  complete: "يكمل",
  correct: ["صحيح", "يصحح"],
  wrong: "خطأ",

  // --- Family, People & Home ---
  family: "عائلة",
  mother: "أم",
  mom: "ماما",
  father: "أب",
  dad: "بابا",
  brother: "أخ",
  sister: "أخت",
  baby: "طفل رضيع",
  child: "طفل",
  children: "أطفال",
  boy: "ولد",
  girl: "بنت",
  friend: "صديق",
  people: "ناس",
  person: "شخص",
  house: "منزل",
  home: "بيت",
  room: "غرفة",
  door: "باب",
  window: "نافذة",
  garden: "حديقة",
  kitchen: "مطبخ",
  bed: "سرير",

  // --- Food, Drink & Daily Life ---
  food: "طعام",
  drink: "يشرب",
  eat: "يأكل",
  apple: "تفاحة",
  banana: "موزة",
  orange: "برتقال",
  bread: "خبز",
  milk: "حليب",
  tea: "شاي",
  rice: "أرز",
  meat: "لحم",
  chicken: "دجاج",
  fish: "سمك",
  egg: "بيضة",
  cheese: "جبن",
  fruit: "فاكهة",
  vegetable: "خضار",
  morning: "صباح",
  afternoon: "بعد الظهر",
  evening: "مساء",
  night: "ليل",
  time: "وقت",
  clock: "ساعة حائط",
  watch_clock: "ساعة يد",
  today: "اليوم",
  tomorrow: "غدًا",
  yesterday: "أمس",
  week: "أسبوع",
  month: "شهر",
  year: "سنة",

  // --- Common Verbs ---
  go: "يذهب",
  come: "يأتي",
  live: "يعيش",
  work: "يعمل",
  play: "يلعب",
  run: "يجري",
  walk: "يمشي",
  jump: "يقفز",
  sleep: "ينام",
  wake: "يستيقظ",
  give: "يعطي",
  take: "يأخذ",
  make: "يصنع",
  do: "يفعل",
  open: "يفتح",
  close: "يغلق",
  stop: "يتوقف",
  start: "يبدأ",
  begin: "يبدأ",
  finish: "ينهي",
  buy: "يشتري",
  sell: "يبيع",
  like: "يحب",
  love: "يحب",
  need: "يحتاج",
  want: "يريد",
  try: "يحاول",
  use: "يستخدم",
  keep: "يحافظ على",
  grow: "يكبر أو ينمو",
  show: "يوضح أو يري",
  tell: "يخبر",
  ask: "يسأل أو يطلب",
  call: "ينادي أو يتصل",
  meet: "يقابل",
  stay: "يبقى",
  put: "يضع",
  bring: "يحضر",
  send: "يرسل",
  receive: "يستلم",

  // --- Common Adjectives & Adverbs ---
  good: "جيد",
  bad: "سيء",
  big: "كبير",
  small: "صغير",
  great: "عظيم",
  happy: "سعيد",
  sad: "حزين",
  fast: "سريع",
  slow: "بطيء",
  hot: "حار",
  cold: "بارد",
  warm: "دافئ",
  easy: "سهل",
  hard: ["صعب", "صلب"],
  difficult: "صعب",
  new: "جديد",
  old: "قديم أو كبير في السن",
  young: "صغير السن",
  strong: "قوي",
  weak: "ضعيف",
  safe: "آمن",
  rich: "غني",
  poor: "فقير",
  tall: "طويل القامة",
  short: "قصير",
  long: "طويل",
  high: "مرتفع",
  low: "منخفض",
  near: "قريب",
  far: "بعيد",
  early: "مبكرًا",
  late: "متأخرًا",
  always: "دائمًا",
  usually: "عادةً",
  often: "غالبًا",
  sometimes: "أحيانًا",
  never: "أبدًا",
  together: "معًا",
  well: "بشكل جيد",
  very: "جدًا",
  here: "هنا",
  there: "هناك",

  // --- Health, Body & Science ---
  body: "جسم",
  head: "رأس",
  eye: "عين",
  ear: "أذن",
  nose: "أنف",
  mouth: "فم",
  hand: "يد",
  arm: "ذراع",
  leg: "ساق",
  foot: "قدم",
  heart: "قلب",
  doctor: "طبيب",
  hospital: "مستشفى",
  healthy: "صحي",
  sick: "مريض",
  energy: "طاقة",
  light: ["ضوء", "خفيف"],
  dark: "مظلم",
  planet: "كوكب",
  space: "فضاء",
};

/**
 * Irregular words map: Maps past/participles/plurals to their root form.
 */
const IRREGULAR_LEMMAS: Record<string, string> = {
  went: "go",
  gone: "go",
  going: "go",
  gave: "give",
  given: "give",
  saw: "see",
  seen: "see",
  took: "take",
  taken: "take",
  made: "make",
  wrote: "write",
  written: "write",
  read: "read",
  said: "say",
  say: "say",
  told: "tell",
  knew: "know",
  known: "know",
  thought: "think",
  felt: "feel",
  found: "find",
  became: "become",
  began: "begin",
  begun: "begin",
  brought: "bring",
  built: "build",
  bought: "buy",
  caught: "catch",
  came: "come",
  did: "do",
  done: "do",
  drew: "draw",
  drawn: "draw",
  drank: "drink",
  drunk: "drink",
  drove: "drive",
  driven: "drive",
  ate: "eat",
  eaten: "eat",
  fell: "fall",
  fallen: "fall",
  flew: "fly",
  flown: "fly",
  grew: "grow",
  grown: "grow",
  had: "have",
  heard: "hear",
  kept: "keep",
  left: "leave",
  met: "meet",
  paid: "pay",
  ran: "run",
  sat: "sit",
  slept: "sleep",
  spoke: "speak",
  spoken: "speak",
  spent: "spend",
  stood: "stand",
  swam: "swim",
  swum: "swim",
  taught: "teach",
  wore: "wear",
  worn: "wear",
  won: "win",
  understood: "understand",
  children: "child",
  men: "man",
  women: "woman",
  teeth: "tooth",
  feet: "foot",
  mice: "mouse",
  people: "person",
  better: "good",
  best: "good",
  worse: "bad",
  worst: "bad",
};

/** Normalize entry into standard DictionaryDefinition structure. */
function parseRawEntry(entry: RawDictionaryEntry): DictionaryDefinition {
  if (typeof entry === "string") {
    return { primary: entry, meanings: [entry] };
  }
  if (Array.isArray(entry)) {
    return { primary: entry[0] || "", meanings: entry };
  }
  if (entry && Array.isArray(entry.meanings)) {
    return {
      primary: entry.meanings[0] || "",
      meanings: entry.meanings,
    };
  }
  return { primary: "", meanings: [] };
}

/**
 * Perform morphology stemming to attempt finding a base dictionary form.
 */
function generateCandidateRoots(word: string): string[] {
  const candidates: string[] = [word];

  // 1. Irregular forms lookup
  if (IRREGULAR_LEMMAS[word]) {
    candidates.push(IRREGULAR_LEMMAS[word]!);
  }

  // 2. Strip possessive 's or '
  if (word.endsWith("'s")) {
    candidates.push(word.slice(0, -2));
  } else if (word.endsWith("s'")) {
    candidates.push(word.slice(0, -1));
  }

  // 3. Verb endings (-ing)
  if (word.endsWith("ing") && word.length > 4) {
    const base = word.slice(0, -3);
    candidates.push(base);              // e.g. clean(ing)
    candidates.push(base + "e");        // e.g. writ(e) -> writing, mak(e) -> making
    // Double consonant: e.g. running -> run, swimming -> swim
    if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
      candidates.push(base.slice(0, -1));
    }
  }

  // 4. Past tense (-ed)
  if (word.endsWith("ed") && word.length > 3) {
    const base = word.slice(0, -2);
    candidates.push(base);              // e.g. protect(ed), clean(ed)
    candidates.push(word.slice(0, -1)); // e.g. pollute(d) -> polluted
    if (word.endsWith("ied") && word.length > 4) {
      candidates.push(word.slice(0, -3) + "y"); // e.g. studied -> study
    }
    if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
      candidates.push(base.slice(0, -1)); // e.g. stopped -> stop
    }
  }

  // 5. Plurals (-ies, -es, -s)
  if (word.endsWith("ies") && word.length > 4) {
    candidates.push(word.slice(0, -3) + "y"); // e.g. stories -> story
  }
  if (word.endsWith("es") && word.length > 3) {
    candidates.push(word.slice(0, -2)); // e.g. boxes -> box
  }
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 2) {
    candidates.push(word.slice(0, -1)); // e.g. trees -> tree, plants -> plant
  }

  // 6. Adverbs (-ly)
  if (word.endsWith("ly") && word.length > 3) {
    candidates.push(word.slice(0, -2)); // e.g. quickly -> quick
    if (word.endsWith("ily") && word.length > 4) {
      candidates.push(word.slice(0, -3) + "y"); // e.g. happily -> happy
    }
  }

  return candidates;
}

/**
 * Look up an English word in the offline dictionary.
 * Supports exact matching, lowercasing, and intelligent morphology stemming.
 */
export function lookupWord(rawWord: string): DictionaryDefinition | null {
  if (!rawWord) return null;
  const clean = rawWord.trim().toLowerCase();

  // Try candidate roots in order
  const candidates = generateCandidateRoots(clean);

  for (const cand of candidates) {
    if (cand in DICTIONARY_DATABASE) {
      return parseRawEntry(DICTIONARY_DATABASE[cand]!);
    }
  }

  return null;
}

/** Total entries loaded in the offline dictionary. */
export function getDictionaryCount(): number {
  return Object.keys(DICTIONARY_DATABASE).length;
}
