/**
 * prepare-ocr.mjs
 *
 * Copies Tesseract.js OCR runtime assets from node_modules into public/ocr/
 * so they are served from the same origin and cached by the Service Worker.
 *
 * Run automatically as part of `npm run build`.
 */

import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import { execFile }                        from "node:child_process";
import { promisify }                       from "node:util";
import { resolve }                         from "node:path";

const run        = promisify(execFile);
const root       = process.cwd();
const ocrOutput  = resolve(root, "public", "ocr");
const coreSource = resolve(root, "node_modules", "tesseract.js-core");
const workerSrc  = resolve(root, "node_modules", "tesseract.js", "dist", "worker.min.js");
const langUrl    = "https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz";
const langTarget = resolve(ocrOutput, "lang", "eng.traineddata.gz");

// Ensure output directories exist
await mkdir(resolve(ocrOutput, "core"), { recursive: true });
await mkdir(resolve(ocrOutput, "lang"), { recursive: true });

// Copy Tesseract worker
await copyFile(workerSrc, resolve(ocrOutput, "worker.min.js"));

// Copy Tesseract core files (.js + .wasm)
for (const file of await readdir(coreSource)) {
  if (
    file.startsWith("tesseract-core") &&
    (file.endsWith(".js") || file.endsWith(".wasm"))
  ) {
    await copyFile(
      resolve(coreSource, file),
      resolve(ocrOutput, "core", file),
    );
  }
}

// Download English language data if not already present (≈10 MB)
// curl.exe is bundled with Windows 10 1803+ and streams without Node memory pressure.
let langExists = false;
try {
  langExists = (await stat(langTarget)).size > 0;
} catch {
  langExists = false;
}

if (!langExists) {
  console.log("Downloading English OCR language data (~10 MB)…");
  await run("curl.exe", [
    "--fail",
    "--location",
    "--progress-bar",
    "--output", langTarget,
    langUrl,
  ]);
}

console.log("✓ OCR assets ready (worker, core, English model).");
