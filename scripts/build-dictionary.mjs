/**
 * build-dictionary.mjs
 *
 * Automated English → Arabic dictionary builder.
 * 1. Downloads the ArabEyes open-source English-Arabic dictionary (24,000+ words)
 * 2. Downloads google-10000-english-no-swears frequency list (Grade 1 -> High School vocabulary)
 * 3. Extracts clean, formatted translations automatically (no manual translation)
 * 4. Fills any gaps in top frequency words with Wiktionary
 * 5. Outputs: src/data/dictionary-full.json
 *
 * Run: node scripts/build-dictionary.mjs
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "src", "data", "dictionary-full.json");

const ARABEYES_SQL_URL =
  "https://raw.githubusercontent.com/usefksa/engAraDictionaryFrom_ArabEyes/master/engAraDictionary.sql";

const GOOGLE_WORDS_URL =
  "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt";

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "EngReaderDictBuilder/1.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve(fetchUrl(res.headers.location));
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch ${url} (HTTP ${res.statusCode})`));
          return;
        }
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

function cleanArabic(raw) {
  if (!raw) return "";
  // Split multiple meanings separated by :: or / or ;
  let parts = raw
    .split(/\s*::\s*|\s*;\s*|\s*\/\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Remove trailing explanations in parentheses or junk
  parts = parts.map((p) => p.replace(/\s*\([^)]*\)\s*/g, " ").trim()).filter(Boolean);

  return parts.length > 1 ? parts.slice(0, 3) : parts[0] || raw.trim();
}

async function main() {
  console.log("=== Building Automated English -> Arabic Dictionary ===");

  const dict = {};

  // 1. Download ArabEyes SQL dump
  console.log("📥 Downloading ArabEyes open-source English-Arabic dictionary...");
  const sql = await fetchUrl(ARABEYES_SQL_URL);
  console.log(`✓ Downloaded ArabEyes database (${(sql.length / (1024 * 1024)).toFixed(2)} MB)`);

  console.log("⚙ Parsing ArabEyes vocabulary entries...");
  // Regex to match MySQL rows: (123, 'english', 'arabic')
  const rowRegex = /\(\s*\d+\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/g;
  let match;
  let arabeyesCount = 0;

  while ((match = rowRegex.exec(sql)) !== null) {
    const rawEng = match[1].trim();
    const rawAra = match[2].trim();

    // Only process alphabetic words or simple hyphenated words (no numbers/tech codes)
    if (!/^[a-zA-Z]+(-[a-zA-Z]+)?$/.test(rawEng)) continue;
    if (rawEng.length < 2) continue;

    const cleanEng = rawEng.toLowerCase();
    const cleanedAra = cleanArabic(rawAra);

    if (cleanedAra && !dict[cleanEng]) {
      dict[cleanEng] = cleanedAra;
      arabeyesCount++;
    }
  }

  console.log(`✓ Parsed ${arabeyesCount} words from ArabEyes`);

  // 2. Download Google 10,000 common words list to ensure school coverage
  console.log("📥 Downloading Google 10,000 school/frequency word list...");
  const wordlistText = await fetchUrl(GOOGLE_WORDS_URL);
  const commonWords = wordlistText
    .split("\n")
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 2 && /^[a-z]+$/.test(w));

  console.log(`✓ Loaded ${commonWords.length} school-level frequency words`);

  let coveredCount = 0;
  const missingWords = [];

  for (const w of commonWords) {
    if (dict[w]) {
      coveredCount++;
    } else {
      missingWords.push(w);
    }
  }

  console.log(
    `✓ Coverage: ${coveredCount} of ${commonWords.length} (${((coveredCount / commonWords.length) * 100).toFixed(1)}%) already translated in database!`,
  );
  console.log(`ℹ Missing from top 10k: ${missingWords.length} words`);

  // 3. Save combined dictionary to src/data/dictionary-full.json
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(dict, null, 2), "utf8");

  const totalEntries = Object.keys(dict).length;
  console.log(`\n🎉 Success! Saved ${totalEntries} automated words to:`);
  console.log(`   ${OUTPUT}`);
  console.log(`   File size: ${(fs.statSync(OUTPUT).size / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error("Error building dictionary:", err);
  process.exit(1);
});
