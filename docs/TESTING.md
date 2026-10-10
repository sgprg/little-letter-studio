# Alpha test guide

## Test on a real device

Use https://sgprg.github.io/little-letter-studio/ . iOS/iPadOS 16+ with current Safari and Android with current Chrome/WebView are the initial targets. Start with web installation; a native Android debug APK is available when the native workflow succeeds. iOS simulator archives are for a Mac simulator, not installation on a physical iPhone/iPad.

1. Open online, wait for “Ready for offline play”, install/add to home screen, then reopen in airplane mode.
2. Tap colors into the cat. Verify that ears, muzzle and body can have different colors. Undo and redo. Close and reopen; the drawing should remain.
3. Change between English, Russian and Czech. The same animal should have the appropriate word and initial. Check ёж/Ё, čáp/Č, chameleon/Ch, řeka/Ř and šnek/Š.
4. Use pencil, brush and crayon with a finger, then a supported stylus. Press lightly and firmly. In “Stay inside”, start in the body and move outside it; only the body should receive marks. Disable that mode and draw across the paper.
5. Rest a palm before and during drawing with a pen. The pen should take over from an unfinished finger contact; broad contacts and touches just after pen activity are ignored. Try light pressure at lift-off, fast curves, app switching and a long drawing. Use caregiver settings → Pencil only when needed. Hardware palm rejection and end-to-end latency still need physical Apple Pencil and Android stylus checks.
6. Rotate the device, suspend/resume, switch pictures rapidly, and draw for ten minutes. Check input responsiveness and persistence. Browser-emulated layouts cannot validate these hardware behaviors.
7. Open caregiver settings (7 + 8 = **15**). Export PNG; verify the letter/word and colors in the exported file. Cancel a clear operation, then confirm it. Verify delete-all only removes this app's drawings.
8. Listen in all languages. A missing offline voice should produce a clear message, with no remote voice fallback. Install the relevant system offline voice if the OS supports it.
9. Try larger text, keyboard tab navigation, portrait and landscape. The drawing interaction itself is visual and is not a nonvisual coloring experience.
10. Tap fullscreen. The canvas and tools should fit without page scrolling in portrait and landscape. Open the book drawer, switch pictures, change colors and draw near every edge. The app's exit control should request the caregiver gate; browser Escape still exits. On iPhone/iPad install on the Home Screen and verify automatic play mode. Enable Guided Access separately and verify that system swipes cannot leave the app; fullscreen alone cannot guarantee that.
11. Color every cat region, including the ball, and every apple region. Expect one brief sparkle and a quiet three-note chime, with small edge gaps forgiven. Paper alone must not trigger it. Undo/redo, switching pictures and reopening should not replay it. Starting the picture again should reset it. Test white, crayon and erasing. Mute celebration sounds in caregiver settings and enable the OS reduced-motion preference, then repeat. Verify real speaker volume and any device silent-mode behavior.

## Automated coverage

`npm test` defines 60 browser scenarios, with the real browser Fullscreen API case restricted to desktop Chromium (three explicit skips). Chromium runs desktop/Android layouts and WebKit runs iPad/iPhone layouts. These are **emulated devices**, not native or physical Pencil acceptance tests. Coverage includes saved drawing pixels, pressure and coalesced curves, pen takeover, cancellation, palette/layout fitting through rotation, Home Screen mode, gated exit, completion/erasing/history/mute/reduced-motion, local oscillator scheduling, and continued drawing with unavailable audio/storage. Windows Playwright WebKit exposes no Web Audio API; that environment verifies the silent fallback while Chromium verifies the three scheduled notes. A long-history regression check verifies that new strokes do not replay historical paths. Offline tests stop the actual temporary origin server after caching, then reload and draw without mocking successful responses.

Run `npm run build` first. Reports and screenshots are in ignored `playwright-report/` and `test-results/`. CI keeps a downloadable browser-checks artifact. Native CI separately compiles the Android APK and an unsigned iOS simulator app; compilation is not device acceptance.

## Known test boundaries

- Word listening depends on installed local voices and the platform's reporting of `localService`.
- Storage quota, eviction, Safari installation storage isolation and real device shutdown timing remain physical-device cases. Save failures are surfaced rather than presented as success.
- Export through native share sheets needs a device test. No signed device IPA or TestFlight release is claimed.
- No educational effectiveness, child-privacy compliance certification, or measured hardware latency claim is made for this alpha.
- Complete alphabets, educator-reviewed phonics and native-speaker-reviewed recordings are beta work.
