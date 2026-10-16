# Status: phase 1 (core presenting)

## Done (each item was run; results below)

1. **Deck format**: `src:` imports (with `#2,4-6` ranges, importer's keys win, missing file reported), headmatter `defaults`,
   `routeAlias` (address and TOC links), `level`, `title`, `hideInToc`, speaker notes (stored in the metadata, not shown),
   `clicks` (total override), `clicksStart`, `transition`, per-slide scoped `<style>`, `::name::` slot sugar.
2. **All layouts**: default, cover, intro, center, section, statement, fact, quote, end, full, none, image, image-left, image-right,
   iframe, iframe-left, iframe-right, two-cols, two-cols-header, plus `404` and `error`; props `image`, `url`, `scale`, `background`,
   `backgroundSize`, `class`, `layoutClass`. Unknown layout: warning with the list of names, falls back to `default`.
3. **Navigation bar** at the bottom left (fullscreen, previous, next, overview, dark mode, drawing placeholder, presenter placeholder,
   info, settings, counter), shown on hover, Carbon icons through UnoCSS.
4. **Right-click menu** (four arrows, drawing/overview/presenter/fullscreen entries, native-menu hint; Shift keeps the native menu).
5. **Transitions**: `slide-left/right/up/down`, `fade`, `fade-out`, `view-transition`, forward and backward variants, per-slide and deck default.
6. **Overview** with live thumbnails at the last click (lazy with `@defer`), click, arrows, Enter, Escape.
7. **Shortcuts** with Slidev's keys, as a list that a deck can change (`SHORTCUTS_SETUP`); `g` goto box; `f`, `o`, `d`, Escape.
8. **Dark mode**: `colorSchema`, toggle, remembered in `localStorage`, `dark` class on `<html>`, all layouts checked in both modes (pictures in `docs/screenshots/`).
9. **Built-ins**: `<slide-toc>` (all options), `<slide-link>`, `<slide-current-no>`, `<slides-total>`, `<light-or-dark>`, `<render-when>`, `<v-switch>`, `<v-click-gap>`.
10. Info dialog (headmatter `info`) and a small settings menu (slide scale, hide idle cursor).

## Test results (last run, Node 22.23.3, Chromium from `/opt/pw-browsers`)

- `npm run build`: succeeds, no warnings printed.
- `npm test`: 12 files, **118** tests passed.
- `npm run test:e2e`: starter deck **39** passed, 0 failed; showcase deck **144** passed, 0 failed
  (layouts 40, controls 42, shortcuts 20, transitions 11, built-ins 30, plus one check for no console errors or warnings).
- `npm run test:dev`: **6** passed (5 of 5 edits updated the open page without a reload, no console errors).
- `npm run screenshots`: wrote 44 pictures to `docs/screenshots/` (19 layouts x light/dark, nav bar, context menu, overview).

I looked at a sample of the pictures (cover, two-cols-header, image-left, iframe-right, quote, overview, nav bar, context menu).

## Not done (later phases or left out on purpose)

- Presenter view and its sync, drawing, recording, camera, Monaco, Shiki and code highlighting, export/print (`?print`), PWA.
- Touch and swipe controls, wake lock, CSS filter settings, the "side editor".
- Typing digits inside the overview, Slidev's key auto-repeat timer, `contextMenu` frontmatter option, `preload`, `zoom`, `dragPos`, `lang`.
- `render-when context="visible"`; transitions as CSS classes (Vue style `*-enter-active`); `<v-switch>` transition props.
- Showing the `error` layout (it exists, nothing uses it yet).
- Showing speaker notes anywhere (needs the presenter view).
- Lazy loading of slide components (all slides are in the main bundle).

## Problems and limits found

- Editing a slide's title, frontmatter or notes changes the generated `index.ts`, and the dev server then does a full page reload (as in phase 0).
  Editing body text updates in place.
- In-place updates re-create the slide component, so a component's own state goes back to its start value.
- Per-slide `<style>` uses CSS nesting. It reaches into the layout's own elements (more than Vue's scoped CSS) and does not support `--uno:`.
- Browsers: Angular's `[src]` on an iframe needs a trusted-URL bypass (done for the layouts), so the `url` frontmatter is trusted as written.
- The generator warns about problems (unknown layout, unknown slot, bad import) but does not stop.
- `/` addresses with a number clamp (`/99` shows the last slide); any other unknown address shows `404`.
- Image paths such as `/photo.png` are used as written (served from `public/`); a deck hosted under a sub-path needs a relative path.
- Dark mode is applied after Angular starts, so a dark-mode user may see one light frame at load.

## NOT VERIFIED

- Looks versus real Slidev: only compared by reading Slidev's CSS and layouts; no side-by-side picture (not possible offline). The `full` layout (no padding here, see phase 1 decision 9) may differ.
- Browsers other than Chromium: Firefox and Safari (View Transitions, CSS nesting for slide styles, `translate` in animations), Windows and macOS.
- Fullscreen was checked in headless Chromium only; real fullscreen with the Escape key not tried by hand.
- `colorSchema: light|dark` in the headmatter has unit-level reasoning only, no browser test.
- Overview with hundreds of slides (speed, memory), mobile viewports, touch input, print.
- Node versions below 22.23.3; `npm install` from a clean machine (dependencies were added incrementally in this folder).
- Dev server with the generator watching when an imported (`src:`) file is edited: the watcher code was written but only the main file was edited in the test.
- The zip was not unpacked and rebuilt.
