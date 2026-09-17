# Architecture

`src/content.ts` holds stable concept IDs, localized words/letters/sentences, UI text and palette names. `src/art.ts` holds original vector paths; region order determines occlusion. Thumbnails use the same source as the canvas.

`DrawingEngine` renders at 1600×1300 pixels in logical 800×650 coordinates. Pointer Events normalize mouse/touch/pen coordinates; pen pressure adjusts stroke width. One pointer owns a gesture. Additional contacts are ignored while a gesture is active; pen-only mode rejects finger marks. This is not a full palm classifier. Cancellation discards an incomplete gesture. Existing lines are drawn last. Region clipping excludes all overlapping regions in front, so one-tap fills do not spill into eyes or other foreground shapes. Open decorative lines do not create independent fill regions.

Actions are plain serializable data. History uses a cursor, with new actions truncating redo. There is a deliberate limit of 300 actions and 30,000 sampled points per page to bound memory, replay and disk growth. Rendering is scheduled once per animation frame during input. Canvas redraw currently replays actions; benchmark long sessions on low-end devices before raising the cap. It does not yet use a native low-latency drawing layer.

`src/storage.ts` uses a versioned IndexedDB store and validates loaded records. A serialized save queue commits after completed gestures. Local preferences use localStorage. Failed loads do not silently replace the stored picture; the parent can explicitly clear it. The active picture remains usable in memory when writes fail. Export remains available. No network request is involved in saving.

`scripts/build-offline.mjs` hashes the complete static bundle and service-worker source, then generates a precache. Same-origin static responses are served from cache; cache identity includes scope so separate installations do not delete each other's caches. Updates wait for old clients to close, avoiding hot replacement during a stroke. Reopen after closing all tabs to activate an available update. Native apps skip service workers and use their bundled files.

Capacitor owns Android/iOS wrappers. Native PNG sharing uses Filesystem's cache directory and the OS share sheet; web export uses Web Share when supported or a file download. The exported image includes the selected letter and word. The temporary native file is deleted when sharing completes. No camera, microphone or contacts are requested. Android cloud backup is disabled for the app. Web/OS backup behavior outside the app remains under the user's platform settings.

Speech synthesis selects only a voice that the device reports as `localService`. No remote fallback is allowed. That property is a platform declaration, not a packet-level audit of a device's speech engine. Local voice availability and voice quality vary by OS and locale; bundled reviewed recordings are a beta milestone.
