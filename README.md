# English Vocabulary Reader (EngReader PWA)

A focused, offline-first Progressive Web App (PWA) that lets anyone photograph an English textbook page, extracts the vocabulary words using local on-device OCR, looks up Arabic meanings from a built-in dictionary, and speaks them out loud in a 3x English + 1x Arabic sequence — no typing, no cloud APIs, and no internet required after install.

Designed specifically for an **iPhone 7 Plus running iOS 15.8.8 Safari**, but works great on **Android (Chrome)**, **Windows**, and **macOS**.

**GitHub Repo:** [https://github.com/0xKernelEclipse/eng-reader](https://github.com/0xKernelEclipse/eng-reader)

---

## What It Does (Core Flow)

1. **Snap or Pick a Photo:**
   - Tap **"Take a Photo"** (`capture="environment"`) to launch the camera directly.
   - Or tap **"Choose a Photo"** to pick from your gallery.
   - Or tap **"Try Sample Page"** to instantly load a built-in textbook sample without needing a physical book.
2. **Local OCR (Zero Cloud):**
   - Tesseract.js runs entirely inside a Web Worker on the phone. Your photos are never sent to any server.
3. **Vocabulary Extraction & Dictionary Lookup:**
   - Normalizes whitespace, repairs common OCR character noise (e.g. `1` inside words $\to$ `l`), removes duplicates in page order, and filters grammar stopwords in Learning Mode.
   - Matches words against a curated offline English $\to$ Arabic school dictionary with smart morphology lemmatization (plurals, `-ed`, `-ing`, irregular verbs).
4. **Automated Spoken Queue:**
   - Tap **"Start Reading"** and the phone speaks:
     - English word (repeat 1)
     - English word (repeat 2)
     - English word (repeat 3)
     - Arabic meaning (1x)
     - ...then automatically moves to the next word!
5. **Interactive Controls & Word List:**
   - Large touch controls: Play / Pause, Next, Previous, Replay word, and Stop.
   - Tap any word in the list to immediately jump to it and listen.

---

## Device & Platform Support

| Platform | Primary Target | Notes |
|---|---|---|
| **iPhone / iOS** | **iPhone 7 Plus (iOS 15.8.8)** | Safari PWA via **Add to Home Screen**. Full memory management, canvas cleanup, and WebKit speech GC protection. Includes PNG icons for home screen. |
| **Android** | Modern Chrome / Firefox | Direct PWA installation via the "Install App" banner or browser menu. |
| **Windows / Mac** | Chrome, Edge, Safari | Instant desktop access via modern browsers with responsive layout. |

---

## Design Highlights

- **English First, Bilingual Support:** Default interface is English. Tap the **عربي / EN** button in the top bar to toggle Arabic anytime.
- **Dark Mode First:** Sleek, high-contrast dark theme by default, with a light theme toggle. Both language and theme preferences persist in `localStorage`.
- **Large Touch Targets (64–72px):** Big, finger-friendly buttons built for ease of use by non-technical users.
- **Pure SVG Icons:** Crisp vector icons everywhere — zero emojis.
- **Offline Diagnostics Drawer:** Collapsible drawer containing voice checks, Service Worker caching state, and WebAssembly status.

---

## Local Development on Windows 10

> [!NOTE]
> If PowerShell blocks `npm.ps1` due to script execution policies, use `npm.cmd`:

```powershell
# 1. Install dependencies
npm.cmd install

# 2. Generate PNG icons and copy local OCR assets
npm.cmd run gen-icons
npm.cmd run prepare-ocr

# 3. Start local development server
npm.cmd run dev
```

---

## Production Build

```powershell
npm.cmd run build
```

This runs:
1. `gen-icons`: Generates 192×192 and 512×512 PNG app icons for iOS and PWA manifests.
2. `prepare-ocr`: Copies local Tesseract worker, WebAssembly core, and English trained data into `dist/ocr/`.
3. `typecheck`: Runs TypeScript strict type-checking (`tsc --noEmit`).
4. `vite build`: Compiles and minifies assets (entire application JS is under 19 KB gzipped!).
5. `build-service-worker`: Indexes all built static assets into `service-worker.js` for 100% offline cacheability.

To preview the built production app locally:
```powershell
npm.cmd run preview
```

---

## Deploy to Vercel (1-Click)

The repository includes a ready-to-use [`vercel.json`](./vercel.json) configured with appropriate `Content-Type: application/wasm`, `application/gzip`, and Service Worker cache-control headers.

1. Go to [vercel.com/new](https://vercel.com/new) and log in with your GitHub account.
2. Import the repository: **`0xKernelEclipse/eng-reader`**.
3. Set your project name to `eng-reader` (or whatever short URL you prefer).
4. Click **Deploy**. Vercel will build and assign an HTTPS URL like `https://eng-reader.vercel.app`.

---

## How to Install & Test on iPhone 7 Plus (iOS 15.8.8)

1. Open your Vercel URL in **Safari** while connected to the internet.
2. Scroll down to the **Settings & Diagnostics** drawer to verify that the Service Worker and offline assets show as **Cached ✓**.
3. Tap the Safari **Share** button (the square with an arrow pointing up).
4. Select **Add to Home Screen**.
5. Close Safari, switch off Wi-Fi and Cellular Data, and launch **EngReader** from your home screen icon.
6. Tap **"Try Sample Page"** or take a photo, tap **"Start Reading & Extracting Words"**, then hit **"Start Reading"** to verify offline OCR and speech playback.

---

## Project Structure

```
├── public/
│   ├── icons/                 # PNG & SVG PWA app icons
│   ├── manifest.webmanifest   # PWA manifest
│   ├── ocr/                   # Local Tesseract worker, WASM core, and eng traineddata
│   └── test-images/           # Sample textbook page (Our Environment)
├── scripts/
│   ├── build-service-worker.mjs
│   ├── gen-icons.mjs
│   └── prepare-ocr.mjs
├── src/
│   ├── dictionary.ts          # Offline English-Arabic dictionary with lemmatization
│   ├── ocr.ts                 # Local Tesseract OCR runner & image preprocessor
│   ├── speech.ts              # Sequential speech queue (English x 3 -> Arabic x 1)
│   ├── storage.ts             # LocalStorage settings & cached words persistence
│   ├── style.css              # Mobile-first CSS, dark-first palette
│   ├── types.ts               # Shared TypeScript interfaces & types
│   ├── ui.ts                  # UI rendering, i18n translations, diagnostics
│   ├── vocabulary.ts          # OCR cleaning, stop-words filter & token deduplication
│   └── main.ts                # Main orchestrator wiring events & player
├── vercel.json                # Vercel deployment configuration
├── vite.config.ts             # Vite build configuration (Safari 15 target)
└── package.json
```

---

## Important Note on iOS Offline Voices

- The OCR engine and the English $\to$ Arabic dictionary are **100% offline** and stored directly inside the browser cache.
- Speech synthesis relies on the Web Speech voices installed on iOS. The Diagnostics section checks whether the Arabic voice is marked as `local` (offline-capable) or `online` on your device.
