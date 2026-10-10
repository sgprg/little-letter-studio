# Alpha 2 validation — 10 October 2026

Application source: `135422dd0b35c3f43c2208fa2aa44a4e9b9ab1c4`.

| Check | Result / evidence |
| --- | --- |
| Production TypeScript/Vite build | Passed locally and in Linux CI. No new runtime dependencies. |
| Browser suite | **57 passed, 3 explicitly skipped** on Windows and Linux CI. Four layouts: Chromium desktop/Android and WebKit iPad/iPhone. Real Fullscreen API test runs only in desktop Chromium; the other three projects test fallback and installed play mode. |
| Drawing regression | Existing fill/clipping/history/storage/export tests passed. New checks cover coalesced curved samples, pressure at lift-off, finger-to-pen takeover, post-pen and broad-contact suppression, cancellation and cached rendering after 180 strokes. |
| Completion | Cat and apple completion, intentional white, background-only rejection, erasing, undo/redo, quiet restoration, explicit restart, mute persistence and reduced motion passed. |
| Audio | Local oscillator scheduling verified where Web Audio is available. Windows WebKit exposes no Web Audio API, so its silent visual fallback is tested. No physical speaker loudness or iOS silent-mode claim. |
| Layout inspection | Portrait/landscape screenshots inspected. Additional 320-pixel-wide phone check had no horizontal overflow or console errors. |
| Dependency policy | 184 locked npm entries pass the permissive-license allowlist. `source-map-js` patched from 1.2.1 to 1.2.2. Audit reports zero vulnerabilities at validation time. |
| Native builds | Android debug APK and unsigned iPhone/iPad simulator app built successfully. Android version code and Apple build number incremented to 2. Android dependency tree differs from alpha 1 only in the build-duration footer. |
| Production smoke | Live HTTPS app passed in Chromium and iPhone WebKit: assets, service worker, trilingual controls, fullscreen play layout, actual drawing pixels and saving. Chromium also passed offline reload with the saved drawing restored. |
| Cloud resources | No new cloud resource provisioned or paid service added. |

[Web checks and deployment](https://github.com/sgprg/little-letter-studio/actions/runs/38041109500) · [Native builds](https://github.com/sgprg/little-letter-studio/actions/runs/38041109801) · [Release downloads and checksums](https://github.com/sgprg/little-letter-studio/releases/tag/v0.1.0-alpha.2)

Browser automation does not establish physical Apple Pencil latency, hardware palm rejection, native sharing, real audio volume or device gesture locking. Fullscreen cannot prevent an OS exit gesture: use Guided Access or App pinning and verify on the actual device. The iOS artifact is a simulator app, not a signed device IPA. See [TESTING.md](TESTING.md) for physical acceptance checks.
