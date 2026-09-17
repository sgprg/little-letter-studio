# Licensing policy

- Project code, original vector artwork, content and documentation: Apache-2.0.
- Accepted new application dependencies: permissive licenses with required notices retained. Prefer MIT, Apache-2.0, BSD and ISC. No GPL, AGPL, LGPL, MPL, SSPL, noncommercial, or share-alike application dependencies/content.
- Apache-2.0 permits commercial use and closed forks. Our project stays free and open; that promise cannot be imposed on every fork through Apache-2.0.
- Do not copy material from other coloring apps. Free download does not establish redistribution rights. Contributor assets must include provenance and an explicit permissive license.
- Keep the lockfile committed. The npm license script rejects unknown expressions and licenses outside its allowlist. Reviewing dependency license files and vendored code remains a maintainer responsibility.
- Vite 7.3.6 is pinned to avoid Vite 8's MPL-2.0 Lightning CSS dependency, even though a separately used build tool normally does not determine the output's license. Capacitor 8.4.3 avoids an advisory reported for the newer CLI at the research date.
- The Android/iOS bridge is Capacitor MIT, with Apache Cordova components under Apache-2.0. Native export uses Capacitor Filesystem and Share (MIT). AndroidX libraries are Apache-2.0. Review the resolved Gradle/SPM graphs, bundled notices and binary artifacts before public store release. `docs/DEPENDENCIES.json` is explicitly npm-only.
- Compiler/SDK/OS use is separate from redistributing a library inside the application. Git, a browser, Java, Xcode and platform SDKs are not relicensed by this project.

References: [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0), [Capacitor license](https://github.com/ionic-team/capacitor/blob/main/core/LICENSE), [Apache Cordova](https://cordova.apache.org/), [AndroidX](https://source.android.com/docs/setup/about/licenses).
