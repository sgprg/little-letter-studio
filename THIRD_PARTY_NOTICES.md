# Third-party software

Original application code, illustrations and language data: Apache-2.0, as described in LICENSE and NOTICE. No competitor artwork, characters, voices or worksheets are included. System fonts are referenced locally and are not redistributed.

The native Android and iOS shell templates originate from Capacitor (MIT). Capacitor Core, Android, iOS, Filesystem and Share are MIT-licensed, copyright 2017–present Drifty Co. and/or 2020–present Ionic, according to each bundled license. Full notices for installed runtime packages are copied into `public/third-party/` and included in the built app. The native bridge also uses Apache Cordova components under Apache-2.0. AndroidX runtime libraries are under Apache-2.0. The Gradle wrapper is Apache-2.0; build tools keep their respective licenses.

`npm run licenses` checks every entry in the npm lockfile, including development and optional packages, against an explicit permissive allowlist and writes `docs/DEPENDENCIES.json`. This is a metadata gate, not a legal opinion or a complete source-level audit. It does not imply that operating systems, browsers, Xcode, Android SDK tools, or all native transitive packages use the same license. Native distributions require their own resolved-dependency review; see `docs/LICENSING.md`.

The web application uses browser Canvas, IndexedDB, Pointer Events and Speech Synthesis APIs. No cloud SDK, ad SDK, analytics SDK, external font or image service is included.
