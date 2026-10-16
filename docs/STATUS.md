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
5. **Offline mode** (`pwa: true`): manifest, install icons (192, 512, maskable 512), service worker and an "Available offline" / "Offline" label, tested in Chromium with the server stopped.
6. **Command line as a package**: `bin/slide-ng.mjs` with `dev` (default), `build`, `export`, `export-notes`, `format`, `theme eject`, `mcp`, `create`; flags `--port --open --remote --bind --log --force --base (build) --theme`;
   `npm start` runs the same code. Single package with a `template/` folder (DECISIONS.md 11). `create my-deck` was run, and the new deck was formatted and built (the repository stands in for `npm install slide-ng`, see below).
7. **Themes and addons**: `theme:`, `addons:`, `--theme`, folders in the deck, layouts, components, layers, styles, public, UnoCSS settings, default headmatter, the `setup/` hooks (docs/SETUP.md), `theme eject`,
   `examples/theme-minimal` (docs/THEMES.md, docs/WRITING-A-THEME.md). The example theme changes the rendered output and its component is used from slides (browser test).
8. **MCP server** `slide-ng mcp`: seven tools, tested with a scripted client over stdio (initialize, tools/list, get, update, insert, move, remove, refusals, path confinement).
9. **Polish**: the PDF button in the bar (enabled only when the PDF exists), `dev --open`, `--theme`, the side editor takes over outside edits, the next-step preview draws global layers, v-drag boxes were already drawn in thumbnails.
10. **Official themes**: `seriph`, `shibainu`, `bricks` and `apple-basic` rebuilt in `themes/` (layouts with the same names and slots, components, fonts from the provider, colours, defaults); `default` is the built-in look. `theme: <name>` finds them
    before `node_modules` (DECISIONS.md 10), `examples/themes/*.md` show every layout, the READMEs credit the original authors, and NOTICE records the MIT attribution and that no asset was copied (the originals' backgrounds are CC BY-NC-SA and are CSS gradients here).
11. **docs/PARITY.md**: 162 rows, a test found for each `done` row, and a ranked list of gaps.

## Test results (last run, Node 22.23.3, Chromium from `/opt/pw-browsers`)

- `npm run build`: succeeds.
- `npm test`: 82 files, **648** tests passed (the theme names and fonts: `builtin-themes.spec.ts`).
- `npm run test:e2e`: starter deck **45**, showcase **144**, code and content **125**, phase 3 decks **154**, print route **24**, setup hooks **24**, official themes **140** (every layout of four themes, fonts, PNG export of one slide each); 0 failed.
- `npm run test:dev`: live update **6**, dev server **46**; 0 failed (one timing check of the dev server failed in two earlier runs, a different one each time, and passed on the third).
- `npm run test:export`: export command **33**, build **46**, theme **20**, scaffold **13**, MCP **22**; 0 failed.

## Not done

- **Editable PPTX** (out of scope on purpose). PPTX holds pictures and notes only.
- `export` takes one entry; no `--format pptx-editable`.
- `dev --tunnel` (needs a tunnel service; refused with a message) and `dev --base` (refused with a message); `build --router-mode` (use `routerMode`).
- VS Code extension, prettier plugin, Vue-syntax converter, community themes, browser exporter page, `overviewSnapshots` (out of scope).
- Monaco type loading; fonts copied into the build; MDC/Comark; `notesAutoRuby`; slide hooks; custom transition objects; touch tuning for drawing and drag. The full list is in docs/PARITY.md.
- PWA: remote pictures are not cached in dev. Icons are drawn with Chromium at build time (a build without one warns and has no icons).
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

## Not done: official themes

- The original background illustrations (shibainu, bricks) and the random cover photo (seriph) are not used (CC BY-NC-SA, non-commercial): CSS gradients in the same palette stand in, so those layouts match in colour and structure, not in shape.
- `themeConfig` (for example seriph's `primary`) is not read; Prism style sheets are not ported (code colours come from Shiki); Slidev's default theme fonts are not loaded for `theme: default`.
- The decks in `examples/themes/` are one per theme (a deck has one theme); the test stubs the font style sheet, so the fonts themselves were not seen rendered (the request and the CSS font names are checked).

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
