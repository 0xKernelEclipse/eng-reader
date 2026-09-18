/* Development fallback. `npm run build` replaces this with a complete asset list. */
const CACHE_NAME = "english-reader-compat-v1";
const ASSETS = ["/", "/manifest.webmanifest", "/icons/app-icon.svg", "/ocr/worker.min.js", "/ocr/core/tesseract-core.wasm.js", "/ocr/core/tesseract-core.wasm", "/ocr/lang/eng.traineddata.gz"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
