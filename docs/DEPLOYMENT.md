# Deployment and budget record

## Alpha

Host the static `dist/` output on GitHub Pages, via `.github/workflows/web.yml`. The project is portable; hosting is not part of the drawing engine. The Pages deployment has no app backend, database, account service or paid AI/API calls. Public source also makes the build available to families and schools.

A request to create Google Cloud project `little-letter-studio-20260917` failed with project-quota exhaustion on 17 September 2026. No project was created, no existing project was edited, and no billing account was linked. No cloud spend was incurred by this work. Do not work around quota by enabling paid services inside unrelated projects.

## Optional future Google hosting

After project quota is available, create an isolated project, verify no billing account is linked, add Firebase and use **Firebase Hosting on Spark**. Deploy `dist/`. Use relative URLs as committed. Cache versioned assets normally; revalidate `index.html` and `sw.js`. Do not enable Firebase App Hosting, Firestore, Cloud Storage, Functions or Cloud Run for this static alpha.

On Spark, exceeding Hosting quotas can disable serving; this avoids paid overage. On paid plans, budget notifications alone do not impose a hard $50 limit. Keep billing unlinked unless the user explicitly changes the spending model and concrete cost controls are established. Source: https://firebase.google.com/docs/hosting/usage-quotas-pricing .

## Native distribution

Android CI builds a **debug-signed sideloadable APK**, not a production Play Store release. iOS CI builds an **unsigned simulator application**, not a device-installable IPA. Store delivery, Apple signing, review and policy declarations are separate release tasks. No developer membership is purchased by these workflows.

GitHub-hosted standard runners for the public repository and Pages are used without paid add-ons. Use `workflow_dispatch` for native rebuilds if frequent code pushes would create unnecessary work. Disable or delete Pages through repository settings to stop public hosting.
