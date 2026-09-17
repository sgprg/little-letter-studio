# Contributing

Use Node 22+, `npm ci`, and `npm run dev`. Before a pull request run `npm run licenses`, `npm run build`, and `npm test` after installing Playwright Chromium and WebKit. Build native clients when touching Capacitor/platform files.

Keep code and content Apache-2.0. Contributions are supplied under the same license unless explicitly documented otherwise. Add a Signed-off-by line (`git commit -s`) to certify the [Developer Certificate of Origin](https://developercertificate.org/). Only submit work you have the right to contribute. Third-party code and assets must have compatible permissive licenses and retained notices; no copyleft or noncommercial content.

Add pictures in `src/art.ts` as closed, named regions in an 800×650 coordinate space. Add a matching concept in `src/content.ts` with English, Russian and Czech entries. Use the correct initial letter for each word; never translate an English alphabet mapping mechanically. Keep Czech Ch together and Russian Ё distinct. Native-speaker review is required before content leaves alpha.

Avoid analytics, advertisements, purchases, child accounts, remote image/font dependencies and remote speech services. Test touch targets, undo, cancellation, offline reload and saved pictures. Educational claims require evidence. Keep external links, deletion and export behind the caregiver area.
