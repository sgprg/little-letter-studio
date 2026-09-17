# Little Letter Studio 0.1.0 alpha

Play: https://sgprg.github.io/little-letter-studio/

16 coloring pictures, English/Russian/Czech words and letters, 24 colors, tap fill, pencil/brush/crayon/eraser, pressure-aware strokes, optional region clipping, undo/redo, local saves, offline web installation and caregiver-gated PNG export. Free, without ads, purchases, accounts or analytics. Source, original illustrations and curriculum data are Apache-2.0.

- **Web:** open in a current browser. On iPhone/iPad, Safari → Share → Add to Home Screen. On Android, Chrome → Install app. Open online once and wait for the offline-ready message.
- **Android APK:** debug-signed alpha for sideload testing, Android 7+ with a current System WebView. It is not a Play Store production build. To update from an APK signed by a different debug key, export pictures before uninstalling the old build.
- **iOS simulator ZIP:** built for Xcode's simulator on a Mac, not a physical iPhone or iPad. Device installation requires your own signing team; use the web alpha for immediate Apple-device testing.
- **Web ZIP:** static `dist/` bundle for self-hosting. Serve through HTTP on localhost or through HTTPS; opening index.html directly as a file is unsupported.

Automated checks cover Chromium and WebKit, including touch taps, fill pixels, clipping, synthetic pressure, undo/redo, per-language letter mapping, persistence, PNG export, storage failure, and offline reload after stopping the origin server. Physical stylus latency, palm behavior, native share sheets and educational content acceptance remain device/family review work.

This is a 16-picture starter set, not a full alphabet course. Listening needs an installed local device voice. No human recordings or reviewed phonics are included. No cloud resources with billing were created; Google Cloud project creation was blocked by project quota, so the web alpha uses GitHub Pages at $0 provisioned cloud spend.
