# Status: phase 3 (presenter and interaction)

Phases 0 to 2 are unchanged and still pass. Phase 3 added the presenter, sync, drawing, recording, v-drag, canvas settings and the dev companion server.

## Done (each item was run; results below)

1. **Sync core**: `SyncState` signals, `SyncTransport` interface, BroadcastChannel transport; presenter drives, viewers follow through slide and click changes.
2. **Presenter** `/presenter[/:no]`, **notes page** `/notes`, shared timer (`duration`, `timer`), three layouts, next-step preview, click markers in notes, enter/leave presenter mode.
3. **Laser pointer and presenter cursor** on the audience page.
4. **Drawings** with drauu: toolbar, sync, `localStorage`, `.slide-ng/drawings/*.svg` in dev with `drawings.persist`, baked into builds; `enabled`, `persist`, `presenterOnly`, `syncAll`.
5. **Camera and recording** with native MediaRecorder: camera bubble, record/pause/stop, webm download, screen mirror, `record` headmatter.
6. **Settings menu**: dark mode, scale, idle cursor, wake lock (`wakeLock` headmatter), presenter cursor and style, colour filters, camera and microphone options, a disabled PDF entry.
7. **`v-drag`, `<v-drag>`, `<v-drag-arrow>`**: `pos`, `dragPos`, handles, rotation, arrow-key nudging, `activeDragElement` gating, write-back into slides.md in dev (inline, named and bare forms).
8. **`zoom`, `canvasWidth`, `aspectRatio`, `routerMode: hash|history`, four layer components** (`src/app/layers/`).
9. **Dev companion server** (`scripts/dev/`, proxied under `/__slide-ng`): slide patches, drawings files, WebSocket sync, `{monaco-write}`, `npm start -- --remote[=password]` with LAN and presenter URLs, token, Origin, Host, cookie and path checks.
10. **Side editor** (nav bar button, plain textarea, debounced save, live update through the generator).
11. **Placeholders wired**: the nav bar and context menu buttons for drawing and presenter mode are live; camera, record and editor buttons were added.
12. Pictures in `docs/screenshots/`: `presenter-layout-1..3`, `notes-page`, `drawing-toolbar`, `camera-bubble`, `drag-controls`, `side-editor` (`npm run screenshots`).

## Test results (last run, Node 22.23.3, Chromium from `/opt/pw-browsers`)

- `npm run build`: succeeds.
- `npm test`: 45 files, **399** tests passed (new: sync state, timer, drag math, drag sites, patcher, auth, server over real HTTP and WebSocket, drawings, canvas, zoom, layers, recording helpers).
- `npm run test:e2e`: starter deck **45**, layout showcase **144**, code and content deck **125**, phase 3 decks **151** (sync, presenter, laser, drawing, camera, settings, drag, layout); 0 failed.
- `npm run test:dev`: live update **6** passed; dev server **35** passed (v-drag write-back, drawings, side editor, `{monaco-write}`, refused requests, `--remote` password over HTTP and WebSocket, presenter and viewer in two separate browsers over the WebSocket).
- Hand-written code: generator and dev server 1770 lines, app 6126 lines (largest file 152 lines), unit tests 2543, browser tests and test decks 2853, CSS 340, docs 1231.

## Not done

- Export / PDF (the settings entry is disabled), PWA, touch controls, `?print`.
- Recording: no `fix-webm-duration`, so the webm has no duration field; no separate camera file while screen recording; no cloud upload.
- Resizing a rotated box works in the unrotated frame (the box can jump a little); `v-drag` is not available in overview thumbnails or the next-step preview.
- Layers are not drawn in thumbnails or the next-step preview.
- The side editor does not notice edits made elsewhere while it is open; it is a plain textarea, not Monaco.
- `{monaco-write}` only for whole files inside the deck's folder.
- An imported slide (`src:`) outside the deck's folder cannot be edited by the dev server.
- The saved drawing SVG has a fixed 960x540 viewBox.
- No HTTPS for `--remote`.
- Phase 2 lists still apply (see git history of this file for them): Monaco and Mermaid limits, `v-motion` limits, footnote limits.

## Problems found and fixed along the way

- A stale click count was sent after going back a slide; fixed with `Nav.ready` and `setContext`.
- A client sending a WebSocket message over the limit raised an unhandled error that would have stopped the server; fixed and tested.
- An over-size HTTP body reset the connection instead of answering 413; fixed and tested.
- The brush effect reset drauu's mode, so every tool drew a stylus line; fixed.
- UnoCSS finds class names by text, so `[class.name]` bindings get no CSS; inline styles are used there.
- Several tests read the page right after a key press; zoneless Angular updates one tick later, so they now wait.

## NOT VERIFIED

- The real screen-share picker: tests use Chromium's fake devices and an auto-accepted source, so a person choosing a tab or window was not tried. Screen Mirror likewise.
- Recording quality and the file in real players; audio was only the fake tone.
- The wake lock was acquired in headless Chromium; whether the screen really stays awake was not observed.
- `--remote` from a second physical device, a phone, and over a real LAN (tested with 127.0.0.1 and two separate browser profiles). The LAN address printing was only read, not tried on a multi-interface machine.
- Hosts that need `routerMode: hash`: only tested with the local static server.
- Firefox and Safari (MediaRecorder formats, BroadcastChannel, CSS filters), touch input for drawing and v-drag.
- A clean `npm install` on another machine and the zip unpacked and rebuilt.
- Everything under the phase 1 and 2 NOT VERIFIED lists.
