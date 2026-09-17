# Alpha validation — 17 September 2026

Application build commit: `ca53dec`. Subsequent smoke-check/documentation commits do not change the app bundle.

| Check | Result / evidence |
| --- | --- |
| Production TypeScript/Vite build | Passed locally and on Linux CI. Complete static bundle approximately 118 KB uncompressed, including images and notices. |
| Browser scenarios | **32 passed** locally on Windows and on Linux CI: Chromium desktop/Android viewport and WebKit iPad/iPhone viewport. |
| Real offline origin test | Passed in both browser engines after stopping the local HTTP origin server. No successful network mock used. |
| Npm license policy | **184 locked package entries** pass the permissive-expression allowlist, including development/optional dependencies. See `DEPENDENCIES.json`. |
| Npm audit | **0 reported vulnerabilities** at build time. This is a point-in-time database check. |
| Android native build | `assembleDebug` succeeded. Debug-signed APK produced; runtime dependency tree included as an artifact. |
| iOS/iPadOS native build | Xcode simulator build succeeded for arm64 and x86_64. Unsigned simulator app produced. Not a device IPA. |
| Hosted alpha | HTTP 200. Production smoke checks passed in Chromium and WebKit; Chromium also passed offline reload of the live deployment. |
| Cloud spending | No billed resource provisioned. GCP project creation was rejected for exhausted project quota; static hosting uses GitHub Pages. |

Build evidence: [web checks and deployment](https://github.com/sgprg/little-letter-studio/actions/runs/35247392664), [Android and iOS builds](https://github.com/sgprg/little-letter-studio/actions/runs/35247393919).

Physical devices, Apple Pencil latency/palm behavior, Android stylus behavior, native share-sheet operation, installation/signing and educational outcomes have **not** been certified. Use `TESTING.md` for those checks. The npm license gate does not replace a complete native transitive/binary notice review before store distribution.
