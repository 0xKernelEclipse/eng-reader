/**
 * gen-icons.mjs — Generate PNG icons using only Node.js built-ins.
 *
 * No external dependencies required.  Produces solid-colour icons with
 * a simple "book" motif for the PWA manifest and iOS apple-touch-icon.
 *
 * Colours match the dark theme: bg=#090f1d, accent=#3ecfbf.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { deflateSync } from "node:zlib";

const iconsDir = resolve(process.cwd(), "public", "icons");
await mkdir(iconsDir, { recursive: true });

// ── PNG helpers ─────────────────────────────────────────────────────────────

function u32be(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0);
  return b;
}

function makeCrcTable() {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
}
const CRC_TABLE = makeCrcTable();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = (c >>> 8) ^ CRC_TABLE[(c ^ byte) & 0xff];
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const combined  = Buffer.concat([typeBytes, data]);
  return Buffer.concat([u32be(data.length), typeBytes, data, u32be(crc32(combined))]);
}

/**
 * Render a simple icon as a PNG:
 *   - Rounded square background (#090f1d)
 *   - Teal rounded inner square (#3ecfbf)
 *   - Three dark horizontal lines (book motif)
 */
function buildIconPng(size) {
  // We draw into a raw RGBA pixel buffer, then encode as RGB PNG (no alpha channel
  // needed, and smaller file = faster download on iPhone 7 Plus).
  const pixels = new Uint8Array(size * size * 3);

  // Background colour
  const [bgR, bgG, bgB] = [9, 15, 29];      // #090f1d
  const [acR, acG, acB] = [62, 207, 191];   // #3ecfbf
  const [lnR, lnG, lnB] = [9, 15, 29];      // lines same as bg (dark on teal)

  // Fill with background
  for (let i = 0; i < size * size; i++) {
    pixels[i * 3]     = bgR;
    pixels[i * 3 + 1] = bgG;
    pixels[i * 3 + 2] = bgB;
  }

  // Draw teal inner square (55% of size, centred)
  const innerSize  = Math.round(size * 0.55);
  const innerX     = Math.round((size - innerSize) / 2);
  const innerY     = Math.round((size - innerSize) / 2);
  const innerRadius = Math.round(innerSize * 0.14);

  function setPixel(x, y, r, g, b) {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 3;
    pixels[i]     = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
  }

  // Rasterise inner rounded square
  for (let py = innerY; py < innerY + innerSize; py++) {
    for (let px = innerX; px < innerX + innerSize; px++) {
      const rx = px - innerX;
      const ry = py - innerY;
      const r  = innerRadius;
      const w  = innerSize;
      const h  = innerSize;

      // Corners: check if inside the corner circles
      let inside = true;
      if (rx < r && ry < r)               inside = Math.hypot(rx - r, ry - r) <= r;
      else if (rx > w - r - 1 && ry < r)  inside = Math.hypot(rx - (w - r - 1), ry - r) <= r;
      else if (rx < r && ry > h - r - 1)  inside = Math.hypot(rx - r, ry - (h - r - 1)) <= r;
      else if (rx > w - r - 1 && ry > h - r - 1) inside = Math.hypot(rx - (w - r - 1), ry - (h - r - 1)) <= r;

      if (inside) setPixel(px, py, acR, acG, acB);
    }
  }

  // Draw three horizontal "book lines" on the teal square
  const lineThickness = Math.max(2, Math.round(size * 0.04));
  const lineLeft      = innerX + Math.round(innerSize * 0.2);
  const lineWidths    = [0.6, 0.45, 0.35]; // relative widths (longer at top)
  const lineYPositions = [0.32, 0.50, 0.68]; // Y fractions within inner square

  for (let li = 0; li < 3; li++) {
    const ly = innerY + Math.round(innerSize * lineYPositions[li]);
    const lw = Math.round(innerSize * lineWidths[li]);
    for (let t = 0; t < lineThickness; t++) {
      for (let lx = lineLeft; lx < lineLeft + lw; lx++) {
        setPixel(lx, ly + t, lnR, lnG, lnB);
      }
    }
  }

  // Encode as PNG ─────────────────────────────────────────────────────────
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.concat([
    u32be(size),
    u32be(size),
    Buffer.from([
      8,  // bit depth
      2,  // colour type: RGB (no alpha)
      0,  // compression: deflate
      0,  // filter: adaptive
      0,  // interlace: none
    ]),
  ]);
  const ihdr = pngChunk("IHDR", ihdrData);

  // Build raw scanlines: [filter_byte(0)] + [R,G,B] × width, per row
  const rawRows = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    rawRows[y * (1 + size * 3)] = 0; // filter = None
    for (let x = 0; x < size; x++) {
      const src  = (y * size + x) * 3;
      const dest = y * (1 + size * 3) + 1 + x * 3;
      rawRows[dest]     = pixels[src];
      rawRows[dest + 1] = pixels[src + 1];
      rawRows[dest + 2] = pixels[src + 2];
    }
  }

  const compressed = deflateSync(rawRows, { level: 9 });
  const idat = pngChunk("IDAT", compressed);
  const iend = pngChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Generate both sizes
for (const size of [192, 512]) {
  const png = buildIconPng(size);
  const outPath = resolve(iconsDir, `icon-${size}.png`);
  await writeFile(outPath, png);
  console.log(`✓ Generated icon-${size}.png (${(png.length / 1024).toFixed(1)} KB)`);
}
