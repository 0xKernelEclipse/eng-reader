import { readdir, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const dist = resolve(process.cwd(), "dist");

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) =>
      entry.isDirectory()
        ? listFiles(resolve(directory, entry.name))
        : [resolve(directory, entry.name)],
    ),
  );
  return nested.flat();
}

const files = await listFiles(dist);
const paths = [
  "/",
  ...files
    .filter((file) => !file.endsWith("service-worker.js") && !file.endsWith(".map"))
    .map((file) => `/${relative(dist, file).replaceAll("\\", "/")}`),
];

// Deduplicate paths
const uniquePaths = Array.from(new Set(paths));

const source = `/* Service Worker — English Vocabulary Reader */
const CACHE_NAME = "english-reader-v2";
const ASSETS = ${JSON.stringify(uniquePaths, null, 2)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        // Fallback to cached index.html for navigation requests
        if (event.request.mode === "navigate") {
          return caches.match("/");
        }
      });
    })
  );
});
`;

await writeFile(resolve(dist, "service-worker.js"), source);
console.log(`Generated service worker with ${uniquePaths.length} cached assets.`);
