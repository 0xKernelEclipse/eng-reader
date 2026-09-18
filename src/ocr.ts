import { createWorker } from "tesseract.js";
import type { OcrResult, OcrProgressMessage } from "./types.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Maximum long-side dimension before the image is downscaled.
 * Keeps memory pressure low on iPhone 7 Plus while preserving OCR quality.
 */
const MAX_DIMENSION = 1920;

/**
 * Local paths for the OCR assets copied by `scripts/prepare-ocr.mjs`.
 *
 * IMPORTANT — Safari 15 / iOS 15 compatibility note:
 * Tesseract.js 5.x accepts `corePath` as either a directory OR a full path to
 * the .wasm.js file.  Passing the directory alone has been observed to silently
 * fail in some WebKit builds.  We pass the explicit file path to be safe.
 */
const WORKER_PATH = "/ocr/worker.min.js";
const CORE_PATH = "/ocr/core/tesseract-core.wasm.js";
const LANG_PATH = "/ocr/lang";

// ---------------------------------------------------------------------------
// Image pre-processing
// ---------------------------------------------------------------------------

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode image."));
    };
    img.src = url;
  });
}

/**
 * Resize to MAX_DIMENSION, convert to greyscale, boost contrast, and return
 * as a JPEG Blob.  The canvas is shrunk to 1×1 after export to release memory.
 */
export async function prepareImage(file: File): Promise<Blob> {
  const img = await loadImage(file);

  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight),
  );
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas unavailable.");

  // Grayscale + contrast boost — improves OCR accuracy on textbook photos
  ctx.filter = "grayscale(1) contrast(1.4)";
  ctx.drawImage(img, 0, 0, width, height);
  ctx.filter = "none";

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas export failed."))),
      "image/jpeg",
      0.88,
    ),
  );

  // Release the canvas memory immediately
  canvas.width = 1;
  canvas.height = 1;

  return blob;
}

// ---------------------------------------------------------------------------
// OCR
// ---------------------------------------------------------------------------

/**
 * Run Tesseract English OCR on the given file using locally bundled assets.
 * Reports progress via `onProgress`.  The worker is always terminated after
 * the call, even if recognition throws.
 */
export async function runOcr(
  file: File,
  onProgress: (msg: OcrProgressMessage) => void,
): Promise<OcrResult> {
  const prepared = await prepareImage(file);

  const worker = await createWorker("eng", 1, {
    workerPath: WORKER_PATH,
    // Pass the full file path — not just the directory — for Safari 15 safety
    corePath: CORE_PATH,
    langPath: LANG_PATH,
    logger: (msg: OcrProgressMessage) => {
      if (msg.status) onProgress(msg);
    },
  });

  try {
    const { data } = await worker.recognize(prepared);
    const text = data.text.trim();
    return { text, empty: text.length === 0 };
  } finally {
    // Always clean up the WASM worker regardless of success/failure
    await worker.terminate();
  }
}

/** The three OCR asset paths that the offline diagnostic checks. */
export const OCR_ASSET_PATHS = [
  "/ocr/worker.min.js",
  "/ocr/core/tesseract-core.wasm.js",
  "/ocr/lang/eng.traineddata.gz",
] as const;
