# Status: phase 2 (code and content)

Phases 0 and 1 (core presenting, layouts, controls) are unchanged and still pass. Phase 2 added code, math, diagrams, editors, more components,
click markers and markdown extras. Presenter view, drawing, recording and export are still not done.

## Done (each item was run; results below)

1. **Shiki at generate time**: both themes as CSS variables, headmatter `shiki.themes`, `codeAliases`, `lineNumbers`; languages found by a pre-scan.
2. **Line highlights and click-stepped ranges**: `{2,3}`, `{1|2-3|all}`, `at`, `finally`, `lines`, `startLine`, `maxHeight`, title bar, copy button.
3. **Snippets** (`<<< file#region lang {ranges}`, `@/` root, missing file reported) and **code groups** (`::code-group`).
4. **Magic Move** (`@shikijs/magic-move`), steps by clicks, ranges inside steps.
5. **KaTeX** inline and block, with click-stepped block ranges; Angular-safe output; CSS only in decks that use math.
6. **Mermaid** (lazy, theme follows dark mode, cached) with `data-slide-ng-waitfor`, and **PlantUML** (image from a server, encoded while generating).
7. **Monaco**: `{monaco}`, `{monaco-diff}`, `{monaco-run}` (sandboxed iframe, TypeScript through Monaco's own worker, 5 s limit). Works offline, workers bundled.
8. **Twoslash** (`@shikijs/twoslash`, popups in CSS, `ts twoslash`).
9. **Built-in components**: `<arrow>`, `<transform>`, `<auto-fit-text>`, `<youtube>`, `<slide-video>`, `<tweet>`, `<blue-sky>`, registered in `scripts/lib/registry.mjs`.
10. **`v-mark`** (rough-notation: types, colours, `at`, delay, opacity, ranges, click-integrated) and a small **`v-motion`** (`:initial`, `:enter`, `:click-N`, `:click-N-M`, `:leave`).
11. **Markdown extras**: GitHub alerts, task lists, footnotes, icon tags for every installed Iconify set (Carbon, MDI and Phosphor installed).
12. **Showcase deck** `tests/e2e/phase2/slides.md` with 14 feature slides; 28 pictures of them (light and dark) in `docs/screenshots/` (`feature-*.png`).

## TODO for phase 3

- **`{monaco-write}`**: editing the file on disk from the slide. It needs the dev server (a small write endpoint). Today it shows a normal editor and the generator prints a warning.

## Test results (last run, Node 22.23.3, Chromium from `/opt/pw-browsers`)

- `npm run build`: succeeds. Starter deck: initial total 332.70 kB (main 117.26 kB, shared chunk 177.83 kB, styles 37.61 kB).
- `npm test`: 27 files, **230** tests passed.
- `npm run test:e2e`: starter deck **45** passed; layout showcase **144** passed; code and content deck **125** passed (code 26, magic move 10, math 10, diagrams 9, Monaco 17, twoslash 5, components 17, mark 15, markdown 15, plus one for no console errors); 0 failed.
- `npm run test:dev`: **6** passed (5 edits updated the open page without a reload).
- Hand-written code: generator 1068 lines, app 3327 lines (largest file 143 lines), unit tests 1431, browser tests and test decks 1390, CSS 271, docs 1032.

### Bundle sizes

- Starter deck (no code features): the browser output has **no** Monaco, Mermaid, KaTeX, Magic Move or rough-notation code and no worker files (checked by `run.mjs`).
- Phase 2 deck (uses everything): initial = main 357.65 kB + styles 464.79 kB (KaTeX, Monaco and Magic Move CSS) = 822 kB raw, 217 kB compressed.
  Lazy: Monaco TypeScript worker 7.04 MB, Monaco 2.76 MB, Mermaid (several chunks, 1.47 MB for the elk layout alone), Monaco setup 1.32 MB, editor worker 307 kB, KaTeX 262 kB.
  The build prints one budget warning for this deck's initial size (budget 500 kB); the starter deck has none.

## Not done (later phases or left out on purpose)

- Presenter view and its sync, drawing, recording, camera, export/print (`?print`), PWA, touch controls (all as before).
- `{monaco-write}` (see above); Monaco type acquisition (types of npm packages) and Shiki highlighting inside Monaco; `import` in `{monaco-run}`; syntax highlighting of run output; custom runners.
- Code: Slidev's `~icon~` title icons and automatic file icons in code groups; `{monaco}` `editorOptions`; `mhchem` chemistry; `<<<` with a VS Code style `{lines}`-only prefix.
- `v-motion` limits: CSS transitions only. No spring physics, no `hovered` / `tapped` / `focused` / `visible` / `variants`, no keyframe arrays, no presets, no `delay`/`duration` shorthand attributes
  (use `transition` inside a variant). A `v-click` on the **same** element drives it; one on a parent does not. Print and overview show the end state.
- `v-mark`: colours are fixed Tailwind shades (not UnoCSS theme colours); the stroke width does not grow with the slide scale; no `annotationGroup`.
- Footnotes: one paragraph of inline markdown per note, numbers are not links.
- `<tweet>`, `<blue-sky>`, `<youtube>` and PlantUML need the network when presenting. `<slide-video>`: no `print*` props.
- Monaco's JavaScript imports its CSS, and the builder writes it next to the output as unused `chunk-*.css` files (about 190 kB each, not linked) in decks that use Monaco.
- The icon sets `simple-icons` and `vscode-icons` are not installed (so the Bluesky placeholder uses a Carbon icon).

## Problems and limits found

- Same as phase 1 (full reload when the title, frontmatter or notes change in dev mode; in-place updates reset a component's state; per-slide `<style>` uses CSS nesting).
- Twoslash starts a TypeScript program while generating (about one second) and only when a deck has a twoslash block. A block that does not compile loses its types and a warning is printed.
- `{{` inside `$...$` is math and never an interpolation.
- The code option parser reads simple values only (numbers, booleans, text); it does not evaluate JavaScript as Slidev does.
- Rough-notation measures in screen pixels, so its drawing is un-scaled by CSS under the scaled canvas (`code.css`). It looks right in the pictures at 1280x720; other sizes were not compared.

## NOT VERIFIED

- Everything under Phase 1's list still applies (looks versus real Slidev, other browsers, real fullscreen, print, mobile).
- Real network: Mermaid, Monaco and KaTeX run offline and were tested; PlantUML (stand-in server), YouTube, Twitter and Bluesky were **not** tried against the real services.
- Selecting text and moving the cursor with the mouse inside a Monaco editor on a **scaled** canvas (the canvas is scaled with CSS `transform`; Monaco measures in pixels). Typing and running were tested, mouse selection was not.
- `v-mark` and `v-motion` in the overview thumbnails and print (they should show the end state; only reasoned, not tested), and `v-motion` during a slide transition.
- Firefox and Safari for: Monaco workers, `DecompressionStream('deflate-raw')` (Magic Move, Mermaid and Monaco text), CSS `:has()` (task list), `calc(1 / var())` (marks).
- Large decks: build time and size with many Mermaid / Monaco blocks; Twoslash on big projects.
- A clean `npm install` on another machine, and the zip unpacked and rebuilt.
