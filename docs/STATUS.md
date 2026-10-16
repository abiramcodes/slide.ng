# Status: phase 4 (export, tooling, ecosystem)

Phases 0 to 3 are unchanged and still pass. Phase 4 added the print route, export, the static build, head and SEO tags, the offline mode, the
command line as a package, themes and addons, an example theme, the MCP server and the parity table.

## Done (each item was run; results below)

1. **Print route** `/print` and `/presenter/print`: ids `<slide>-<click>`, `?print=clicks`, `?range=`, `data-slide-ng-waitfor` markers on every lazy component.
2. **Export** `slide-ng export`: PDF (one page per slide or click step, outline with `--with-toc`, title), PNG, Markdown with pictures and notes, PPTX of pictures with notes,
   `export-notes`; flags `--format --output --range --with-clicks --dark --timeout --wait --wait-until --executable-path --per-slide --scale --omit-background --with-toc`, `--dist`, `--url`;
   headmatter `exportFilename`, `export`, `download`. File names are sanitised and nothing is written outside the output place.
3. **Static build** `slide-ng build`: `--base`, `--out`, `--download`, `--without-notes`, `--theme`; `404.html`, `_redirects`, hash or history routing, `remoteAssets`, size budgets, docs/HOSTING.md.
4. **Head and SEO**: `title`, `titleTemplate`, `info`, `author`, `keywords`, `favicon`, `lang`, `htmlAttrs`, `seoMeta`, Open Graph picture (`auto` makes a screenshot of slide 1).
5. **Offline mode** (`pwa: true`): manifest and service worker, tested in Chromium with the server stopped.
6. **Command line as a package**: `bin/slide-ng.mjs` with `dev` (default), `build`, `export`, `export-notes`, `format`, `theme eject`, `mcp`, `create`; flags `--port --open --remote --bind --log --force --base (build) --theme`;
   `npm start` runs the same code. Single package with a `template/` folder (DECISIONS.md 11). `create my-deck` was run, and the new deck was formatted and built (the repository stands in for `npm install slide-ng`, see below).
7. **Themes and addons**: `theme:`, `addons:`, `--theme`, folders in the deck, layouts, components, layers, styles, public, UnoCSS settings, default headmatter, the `setup/` hooks (docs/SETUP.md), `theme eject`,
   `examples/theme-minimal` (docs/THEMES.md, docs/WRITING-A-THEME.md). The example theme changes the rendered output and its component is used from slides (browser test).
8. **MCP server** `slide-ng mcp`: seven tools, tested with a scripted client over stdio (initialize, tools/list, get, update, insert, move, remove, refusals, path confinement).
9. **Polish**: the PDF button in the bar (enabled only when the PDF exists), `dev --open`, `--theme`, the side editor takes over outside edits, the next-step preview draws global layers, v-drag boxes were already drawn in thumbnails.
10. **docs/PARITY.md**: 162 rows, a test found for each `done` row, and a ranked list of gaps.

## Test results (last run, Node 22.23.3, Chromium from `/opt/pw-browsers`)

- `npm run build`: succeeds.
- `npm test`: 67 files, **530** tests passed.
- `npm run test:e2e`: starter deck **45**, showcase **144**, code and content **125**, phase 3 decks **152**, print route **24**; 0 failed.
- `npm run test:dev`: live update **6**, dev server **36**; 0 failed.
- `npm run test:export`: export command **33**, build **37**, theme **18**, scaffold **13**, MCP **22**; 0 failed.
- Tests at the last full run: 629 unit tests; browser tests 45, 144, 125, 154, 24 and 24 checks (run, showcase, phase 2 to 5); dev server tests 6 and 46; export tests 123.

## Not done

- **Editable PPTX** (out of scope on purpose). PPTX holds pictures and notes only.
- `export` takes one entry; no `--format pptx-editable`.
- `dev --tunnel` (needs a tunnel service; refused with a message) and `dev --base` (refused with a message); `build --router-mode` (use `routerMode`).
- VS Code extension, prettier plugin, Vue-syntax converter, community themes, browser exporter page, `overviewSnapshots` (out of scope).
- Monaco type loading; fonts copied into the build; MDC/Comark; `notesAutoRuby`; slide hooks; custom transition objects; touch tuning for drawing and drag. The full list is in docs/PARITY.md.
- PWA: no install icons, no "available offline" indicator. Remote pictures are not cached in dev.
- MCP: slide 1 cannot be removed or moved; insert, remove and move need all slides in the entry file.
- The first load of a deck with Monaco and KaTeX is about 850 kB (budget 1.5 MB / 3 MB).
- Recording: no separate camera file, no mp4 or mkv, no cloud upload. No HTTPS for `--remote` (as before).
- Phase 2 and phase 3 lists still apply (Monaco and Mermaid limits, `v-motion` limits, footnote limits, resizing a rotated `v-drag` box, `{monaco-write}` limits, imported slides outside the deck's folder cannot be edited by the dev server).

## Problems found and fixed along the way

- `replaceSource` (side editor and MCP) dropped the blank line under a plain `---`, so a slide's text became frontmatter; fixed with a unit test.
- `safeName('a/../b')` produced `a-.-b`; now `a-b`.
- The notes PDF is 594.96 pt wide, not 595 (A4 rounding); the test accepts both.
- The "outline destination" test was vacuous; it now checks real page numbers, also with clicks.
- The scaffold's create step failed inside the unit test bundle (the file cannot tell where it lives); it now takes the package folder as a parameter.
- An unknown theme package used to be a hard error; it is now a warning with the built-in theme.
- The build test blocked its own "remote" server with a synchronous call; now asynchronous.
- A flaky "a click elsewhere closes the menu" check waited too little for the menu to open; it waits now.
- Running the unit tests and a build at the same time breaks both (they share `src/slides/generated`); tests are run one after the other.

## NOT VERIFIED

- **A real `npm install slide-ng` from a registry** and a publish: the package is private; the scaffold test links this repository into the new deck's `node_modules`.
- `dev --open` opening a real browser window: the flag is passed to `ng serve --open` and parsed in a unit test only.
- `CODE_RUNNERS` (a theme replacing how `{monaco-run}` runs code): written, documented, no test.
- Addons end to end: resolution and merge order are unit-tested, but no deck was built with an addon.
- `theme eject` of a theme that is an npm package (a folder copy is tested through the built-in theme only).
- Export and build with Firefox or WebKit: only Chromium is used. PDF text, page sizes and outlines were checked with the poppler tools and the PPTX through its file structure; none was opened in PowerPoint, Keynote or Acrobat.
- The Open Graph picture and the tags in a real crawler or chat application.
- Hosting on GitHub Pages or Netlify (the files they read are written and the local static server was used).
- The offline mode in browsers other than Chromium, and an update of a deck that is already cached.
- The real screen-share picker, recording quality, the wake lock, `--remote` from a second physical device and over a real LAN, touch input (all as in phase 3).
- Everything under the phase 1 and 2 NOT VERIFIED lists.
