# Alpha test guide

## Test on a real device

Use https://sgprg.github.io/little-letter-studio/ . iOS/iPadOS 16+ with current Safari and Android with current Chrome/WebView are the initial targets. Start with web installation; a native Android debug APK is available when the native workflow succeeds. iOS simulator archives are for a Mac simulator, not installation on a physical iPhone/iPad.

1. Open online, wait for “Ready for offline play”, install/add to home screen, then reopen in airplane mode.
2. Tap colors into the cat. Verify that ears, muzzle and body can have different colors. Undo and redo. Close and reopen; the drawing should remain.
3. Change between English, Russian and Czech. The same animal should have the appropriate word and initial. Check ёж/Ё, čáp/Č, chameleon/Ch, řeka/Ř and šnek/Š.
4. Use pencil, brush and crayon with a finger, then a supported stylus. Press lightly and firmly. In “Stay inside”, start in the body and move outside it; only the body should receive marks. Disable that mode and draw across the paper.
5. Rest a palm while drawing with a pen. In ordinary mode the alpha ignores extra simultaneous contacts but has no full palm classifier. Use caregiver settings → Pencil only when needed.
6. Rotate the device, suspend/resume, switch pictures rapidly, and draw for ten minutes. Check input responsiveness and persistence. Browser-emulated layouts cannot validate these hardware behaviors.
7. Open caregiver settings (7 + 8 = **15**). Export PNG; verify the letter/word and colors in the exported file. Cancel a clear operation, then confirm it. Verify delete-all only removes this app's drawings.
8. Listen in all languages. A missing offline voice should produce a clear message, with no remote voice fallback. Install the relevant system offline voice if the OS supports it.
9. Try larger text, keyboard tab navigation, portrait and landscape. The drawing interaction itself is visual and is not a nonvisual coloring experience.

## Automated coverage

`npm test` runs the drawing/save/history/language/export/offline/layout scenarios in Chromium at desktop, Android phone, iPad and iPhone viewports. These are **emulated layouts**, not native Android/iOS or physical Apple Pencil acceptance tests. Synthetic pen events exercise the input logic only. Pixel assertions verify visible fill and clipping rather than merely checking DOM changes.

Run `npm run build` first. Reports and screenshots are in ignored `playwright-report/` and `test-results/`. CI keeps a downloadable browser-checks artifact. Native CI separately compiles the Android APK and an unsigned iOS simulator app; compilation is not device acceptance.

## Known test boundaries

- Word listening depends on installed local voices and the platform's reporting of `localService`.
- Storage quota, eviction, Safari installation storage isolation and real device shutdown timing remain physical-device cases. Save failures are surfaced rather than presented as success.
- Export through native share sheets needs a device test. No signed device IPA or TestFlight release is claimed.
- No educational effectiveness, child-privacy compliance certification, or measured hardware latency claim is made for this alpha.
- Complete alphabets, educator-reviewed phonics and native-speaker-reviewed recordings are beta work.
