# Little Letter Studio 0.1.0-alpha.2

The second alpha adds fullscreen play, smoother drawing, and a small celebration for completed pictures. Existing saved drawings remain compatible.

- Fullscreen control with a viewport-fitted canvas, portrait/landscape controls, and a picture drawer. Installed and native apps start in play mode. The in-app exit uses the caregiver gate. On iPhone/iPad, use Home Screen installation and Guided Access to keep children in the app; browser fullscreen cannot block system gestures.
- Cached drawing layers replace full-history replay during pointer movement. Coalesced Pencil samples and pressure interpolation preserve curves. Pen takeover, broad-contact rejection, a brief touch suppression window after pen activity, and the existing Pencil-only option reduce accidental palm marks. Real hardware acceptance remains outstanding.
- Coloring at least 95% of each sampled shape interior triggers a brief sparkle and three quiet notes synthesized offline. White counts, erasing removes coverage, and background coloring is optional. Mute is saved; reduced motion gives a static message. A picture celebrates once until explicitly restarted.
- The source-map-js build dependency is patched to 1.2.2; all dependencies remain under the permissive-license policy. No new runtime package or cloud resource is required.

Play at https://sgprg.github.io/little-letter-studio/. If an older offline copy is open, connect once, then close **all** app tabs/windows and reopen after the new service worker has downloaded. Do not clear site data; that would remove saved drawings.

Android downloads are debug-signed sideload builds. CI debug keys can differ between releases: if Android refuses an update, export existing pictures before removing the old installation. The iOS ZIP is an unsigned simulator app for Xcode on a Mac, not a signed device IPA. Home Screen installation is the immediate test route for physical iPhone/iPad devices.

Physical Apple Pencil latency/palm rejection, native share sheets, real speaker volume and device-level gesture locking still require the checks in [TESTING.md](TESTING.md).
