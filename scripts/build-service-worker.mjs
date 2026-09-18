import { readdir, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const dist = resolve(process.cwd(), "dist");
async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => entry.isDirectory() ? listFiles(resolve(directory, entry.name)) : [resolve(directory, entry.name)]));
  return nested.flat();
}

const files = await listFiles(dist);
const paths = [
  "/",
  ...files
    .filter((file) => !file.endsWith("service-worker.js"))
    .map((file) => `/${relative(dist, file).replaceAll("\\", "/")}`),
];
const source = `const CACHE_NAME = "english-reader-compat-v1";\nconst ASSETS = ${JSON.stringify(paths)};\nself.addEventListener("install", event => event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));\nself.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())));\nself.addEventListener("fetch", event => { if (event.request.method !== "GET") return; event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))); });\n`;
await writeFile(resolve(dist, "service-worker.js"), source);
console.log(`Generated service worker with ${paths.length} cached assets.`);
