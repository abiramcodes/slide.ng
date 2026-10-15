# Status: phase 0

## Done (each item was run, results below)

- Repo skeleton: Angular CLI app (standalone, signals, zoneless, default application builder), `scripts/`,
  `slides.md` starter deck (10 visible slides plus one hidden), `docs/`, README, LICENSE, NOTICE.
- Parsing with `@slidev/parser` (`core` entry): separators, per-slide frontmatter, headmatter, notes.
  `layout`, `class`, `hide`/`disabled`, `title`, `clicksStart` are honoured; other keys are kept in the slide metadata.
- Generator writes one component per slide plus `index.ts` and `uno.css` into `src/slides/generated/` (git-ignored).
- Click engine: absolute, relative and range clicks, `v-click`, `v-after`, `v-click-hide`, `<v-clicks>`, `clicksStart`.
- Deck shell: route `/:no`, keyboard navigation, `?clicks=` in the URL, per-slide `ClicksContext`, 16:9 canvas scaled to the window.
- Layouts: `default`, `cover`, `center`, `two-cols` (with `::right::`).
- UnoCSS (wind3 preset), run from the generator script.

## Test results (last run)

- `npm run build`: succeeds, no warnings printed.
- `npm test`: 5 files, 56 tests passed (click engine 25, canvas 3, parse 6, template 12, emit 10).
- `npm run test:e2e`: 39 passed, 0 failed (navigation, clicks of every variant, deep links, code literal text,
  all four layouts, frontmatter class, hidden slide, canvas scaling at 1920x1080 and 800x800, no console errors or warnings).
- `npm run test:dev`: 5 of 5 edits to `slides.md` updated the open page with the `window` marker surviving (no full reload),
  about 0.9 to 1.4 s each, no console errors.

## Not done (out of phase 0 scope)

- Syntax highlighting of code blocks, line highlighting, themes, presenter mode, overview, print/export, drawing, recording.
- `src:` imports of other markdown files, slide `defaults:` frontmatter, per-slide `clicks:` total override,
  other frontmatter-driven props (backgrounds, images).
- A per-slide script block or component state beyond template references and `@let`.
- Lazy loading of slides (all slides are in the main bundle).
- Auto-discovery of custom components (one line in `scripts/lib/registry.mjs` each).
- Slide transitions.

## Problems and limits found

- Editing a slide's title, frontmatter or notes changes the generated `index.ts`, and the dev server then does a full
  page reload instead of an in-place update (checked: editing the first heading gave a reload, marker lost). Editing body text updates in place.
- In-place updates re-create the slide component, so a component's own state (the counter value) goes back to its start value.
- UnoCSS as a command rewrote its CSS file on every change and made the dev server reload every time; fixed by
  running UnoCSS from the generator and writing only when the CSS changed (DECISIONS 9).
- `<v-clicks>` needs blank lines around the list (plain markdown rule). Angular blocks and `@let` must sit on their own line.
- The generated folder does not exist in a fresh checkout until `npm run generate` (or build/start/test) is run, so an editor
  shows missing-import errors before that.

## NOT VERIFIED

- Node versions below 22.23.3 (everything was run with 22.23.3; `engines` says >=22.22.3, as Angular requires).
- Browsers other than Chromium; Windows and macOS (file watching with `fs.watch` recursive, paths).
- `npm install` from a clean machine (dependencies were installed incrementally in this folder).
- Printing, mobile viewports and touch input.
- Behaviour of unusual markdown: indented code fences inside lists, nested `v-clicks`, Angular syntax inside tables.
- Dev server with the generator watching when `slides.md` has a syntax error (an error is printed, but the recovery path was not tested).
- Zip contents were not unpacked and rebuilt.
