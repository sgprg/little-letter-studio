# Little Letter Studio

A free, offline-first coloring book for children aged 2+ and their caregivers. English, Russian and Czech. No ads, purchases, accounts, analytics or paid backend. Project code, language data and original vector illustrations are Apache-2.0.

**Alpha 0.1.0 — a working prototype, not a complete alphabet curriculum.**

[Play the web alpha](https://sgprg.github.io/little-letter-studio/) · [Research and product direction](docs/RESEARCH.md) · [Device test guide](docs/TESTING.md) · [Architecture](docs/ARCHITECTURE.md)

## Try it

Open the web alpha in a current browser. On **iPhone/iPad**, use Safari → Share → Add to Home Screen. On **Android**, use Chrome's Install app/Add to Home screen menu. Desktop browsers work with a mouse, touchscreen or supported pen. Open online and wait for “Ready for offline play” before disconnecting.

Pick a color and touch a picture. Switch between fill, pencil, brush, crayon and eraser. “Stay inside” clips strokes to their starting region; turn it off for free drawing. The + palette button reveals 24 colors. Change language without losing the picture. Undo/redo and saved drawings are local to the browser/device.

The lock button opens caregiver settings (answer **15**): PNG export/share, pen-only mode, and confirmed clearing. This simple gate reduces accidental taps; it is not authentication. Listening works only if a local voice for the selected language is installed. Missing voices are explained without using an online service.

Native Android debug APKs and iOS simulator builds are produced by GitHub Actions when those jobs succeed. See [Actions](https://github.com/sgprg/little-letter-studio/actions). Native iPhone/iPad device installation requires a Mac, Xcode, signing and your own Apple development team. The web install is the immediate test route on Apple devices.

## Build it yourself

Requirements: Node.js 22+ and npm. No secrets or cloud account required.

```sh
npm ci
npm run dev
```

Production and offline checks:

```sh
npm run licenses
npm run build
npm run preview
npx playwright install chromium
npm test
```

Development runs on port 5173; production preview on 4173. Service workers are enabled only in production and require HTTPS or localhost. A phone opening an HTTP LAN address can test drawing but cannot reliably install/cache the PWA; use the HTTPS alpha URL for offline testing. `dist/` can be served by any static host, including a subdirectory.

Native projects are committed in `android/` and `ios/`:

```sh
npm run native:sync
npm run native:android
# On macOS:
npm run native:ios
```

Android uses SDK 36, Java 21, Gradle's wrapper, and min SDK 24. Keep Android System WebView current. Apple alpha testing targets iOS/iPadOS 16 or later. Native UI/pen behavior needs physical-device testing; browser viewport emulation does not certify Apple Pencil support or palm rejection. Native PNG sharing uses the OS share sheet and a temporary app cache file.

## What's included

- 16 editable vector pictures: 13 animals and three familiar-world scenes.
- Correct concept-to-letter mapping per language, including Czech Ch, Č, Ř, Š, Ž and Russian Ё.
- Closed-region fill, pressure-aware freehand tools, 24 colors, erasing, undo/redo.
- Versioned local IndexedDB saves, per-picture restoration, explicit storage-error handling.
- Cached offline web bundle; native apps bundle their assets.
- A parent area with PNG export, deletion and a pen-only option.
- Locked dependencies, a permissive npm license gate, automated browser checks and native build workflows.

## Known limits

The full alphabets, reviewed phonics, recorded human voices, true platform palm rejection, physical-device acceptance, and signed store distribution remain future work. The alpha's voice is device TTS and is not a phonics curriculum. Up to 300 actions / 30,000 points are retained per picture; the app asks for export or undo at that limit. Browsers may evict local data; private browsing is not durable storage. Export important pictures. Different browsers, home-screen installations and native apps may have separate storage. There is no cross-device sync.

## Cost and hosting

The prototype uses GitHub Pages and public-repository Actions. No paid resource was provisioned and no billing account was linked. Creating a new isolated Google Cloud project failed because the account's project quota was exhausted. Existing cloud projects were left untouched. The approved $50 cloud budget remains unused. A future Firebase Spark deployment can host the same static build without linking billing; see [deployment notes](docs/DEPLOYMENT.md).

## Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md). Preserve the free, quiet, multilingual experience and include source/provenance for contributions. [LICENSE](LICENSE), [NOTICE](NOTICE), [third-party notices](THIRD_PARTY_NOTICES.md), and [licensing policy](docs/LICENSING.md) describe the permissive licensing approach.
