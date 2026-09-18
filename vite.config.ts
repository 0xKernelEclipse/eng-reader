import { defineConfig } from "vite";

export default defineConfig({
  build: {
    // Target Safari 15 (iOS 15.8.8) — the actual minimum target device
    target: "safari15",
    // Never inline OCR assets as base64 — they must remain separate cached files
    assetsInlineLimit: 0,
  },
});
