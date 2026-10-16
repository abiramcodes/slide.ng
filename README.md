# slide.ng

Presentations written in markdown, with real Angular template syntax inside.
Inspired by [Slidev](https://sli.dev), built for Angular.

You write one file, `slides.md`. Each slide in it becomes a small Angular
component that is compiled ahead of time with the rest of your app.

```md
---
layout: center
---

# Hello

Count is {{ c.n() }}.

<app-counter #c [start]="5" />

<div v-click>Appears on the first click</div>
```

## Run it

You need Node 22.22.3 or newer.

```sh
npm install
npm start          # dev server at http://localhost:4230, reloads when you edit slides.md
npm run build      # production build of the repository's own deck in dist/slide-ng/browser
```

## The command line

`bin/slide-ng.mjs` is the `slide-ng` command (`npm start` runs the same code as `slide-ng dev`). Without a command it starts the dev server.
A deck is a markdown file; the default is `slides.md`. Decks outside this repository are built in a working copy in `<deck>/.slide-ng/app`.

```sh
node bin/slide-ng.mjs create my-deck           # a new deck folder (slides.md, package.json that depends on slide-ng)
node bin/slide-ng.mjs [dev] [slides.md]        # dev server
node bin/slide-ng.mjs build  [slides.md]       # a static site in ./dist, ready for any web server
node bin/slide-ng.mjs build --offline          # a folder you open from disk (index.html), no server needed
node bin/slide-ng.mjs export [slides.md]       # PDF, PNG, PPTX or Markdown (needs Chromium)
node bin/slide-ng.mjs export-notes [slides.md] # a PDF of the speaker notes
node bin/slide-ng.mjs format [slides.md]       # tidy the markdown file
node bin/slide-ng.mjs theme eject              # copy the theme in use into ./theme to edit it
node bin/slide-ng.mjs mcp [slides.md]          # MCP server on stdio: read and edit slides with a tool client
```

| command  | flags                                                                                                                                                                                                                                                                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dev`    | `--port`/`-p` (4230), `--open`/`-o`, `--remote[=password]`, `--bind <address>`, `--log error\|warn\|info\|silent`, `--force`/`-f` (clear the build cache), `--theme`/`-t`. `--tunnel` and `--base` are refused with a message                                                                                                       |
| `build`  | `--out`/`-o` (`dist`), `--base /talk/`, `--offline` (a folder that opens from disk; no `--base`), `--download` (also make the PDF and a download button), `--without-notes`, `--theme`/`-t`, `--executable-path`, `--timeout`                                                                                                       |
| `export` | `--format pdf\|png\|pptx\|md`, `--output`/`-o`, `--range 1,4-5`, `--with-clicks`/`-c`, `--dark`, `--timeout`, `--wait`, `--wait-until`, `--executable-path`, `--per-slide`, `--scale`, `--omit-background`, `--with-toc`, `--theme`/`-t`, and `--dist <folder>` / `--url <address>` to export an existing build or a running server |
| `create` | `<folder>`, `--force` (add the missing files to a folder that has files)                                                                                                                                                                                                                                                            |

The export needs a Chromium: set `CHROME_PATH` or pass `--executable-path`. It never downloads one. The headmatter can set `exportFilename`, `export: { ... }` (the same names as the flags) and `download`.
Hosting, `--base`, the PDF button, the offline mode and the head tags are in [docs/HOSTING.md](docs/HOSTING.md); going offline for a talk is in [docs/OFFLINE.md](docs/OFFLINE.md). Setup files (`setup/shiki.ts`, `katex.ts`, `mermaid.ts`, `monaco.ts`, `shortcuts.ts`, ...) are in [docs/SETUP.md](docs/SETUP.md). Themes and addons are in [docs/THEMES.md](docs/THEMES.md) and [docs/WRITING-A-THEME.md](docs/WRITING-A-THEME.md); the official themes are packages `@slide-ng/theme-<name>` in the separate slide.ng-themes repository.

Keys: right arrow / space = next click or slide, left arrow = back, `o` overview, `g` go to slide, `d` dark mode, `f` fullscreen.
Move the mouse to the bottom left for the bar, right click for the menu. All keys are in [docs/SYNTAX.md](docs/SYNTAX.md).
The URL is the state: `/7?clicks=2` is slide 7 at click 2.

## What it can do

- Slides from one markdown file, with Angular templates inside (`{{ }}`, `@if`, `@for`, your own components).
- `src:` imports of other markdown files, headmatter `defaults`, `routeAlias`, `level`, `hideInToc`, `clicks`, speaker notes, per-slide `<style>`.
- All 19 Slidev layouts plus `404` and `error`, with the same names and props, and `::name::` slots.
- Clicks: `v-click`, `v-after`, `v-click-hide`, `<v-clicks>`, `<v-switch>`, `<v-click-gap>`.
- Transitions: `slide-left`, `slide-right`, `slide-up`, `slide-down`, `fade`, `fade-out`, `view-transition`.
- Navigation bar, right-click menu, slide overview with live thumbnails, go-to box, info dialog, light and dark mode.
- Built-in `<slide-toc>`, `<slide-link>`, `<slide-current-no>`, `<slides-total>`, `<light-or-dark>`, `<render-when>`.
- Keyboard shortcuts as a list you can change.
- Code: Shiki highlighting at build time, line numbers, line highlights that step with clicks (`{1|2-3|all}`), `<<<` snippets with regions, code groups, copy button, Magic Move.
- Twoslash type popups, KaTeX math (also stepped by clicks), Mermaid and PlantUML diagrams.
- Monaco editors in slides: `{monaco}`, `{monaco-diff}` and `{monaco-run}` (runs the code in a sandbox). Heavy libraries are lazy chunks, only in decks that use them.
- Built-in `<arrow>`, `<transform>`, `<auto-fit-text>`, `<youtube>`, `<slide-video>`, `<tweet>`, `<blue-sky>`.
- `v-mark` (rough-notation marks on clicks) and a small `v-motion`.
- GitHub alerts, task lists, footnotes, and icons as tags (`<carbon-apps />`, `<mdi-account-circle />`, `<ph-star />`; any installed Iconify set).

- Presenter view (three layouts, notes with click markers, timer, next-step preview), notes page, laser pointer and presenter cursor, synced between windows.
- Drawing with a toolbar (drauu), synced, kept in the browser and, with `drawings.persist`, in `.slide-ng/drawings/`.
- Camera bubble, screen and camera recording (native MediaRecorder, webm), screen mirror, settings menu (filters, wake lock, devices).
- `v-drag`, `<v-drag>`, `<v-drag-arrow>` written back into slides.md in dev; `zoom`, `canvasWidth`, `aspectRatio`, `routerMode`, global and slide layers.
- Dev companion server: side editor, `{monaco-write}`, drawing files, WebSocket sync for other devices.

- Export to PDF (with outline), PNG, PPTX (pictures) and Markdown; speaker notes as PDF; `slide-ng build` with `--base`, 404 page, Open Graph picture, remote assets, download button, and an offline worker with install icons and an "Available offline" label (`pwa: true`).
- Themes and addons (`theme:`, `addons:`), `theme eject`, an example theme, `slide-ng create`, `slide-ng format`, an MCP server.
- The official themes `seriph`, `shibainu`, `bricks` and `apple-basic` (and `default`, the built-in look) are packages of the separate slide.ng-themes repository: `npm i -D @slide-ng/theme-seriph`, then `theme: seriph`.

How it compares with Slidev, row by row: [docs/PARITY.md](docs/PARITY.md). What is missing or not checked: [docs/STATUS.md](docs/STATUS.md).
Pictures of the layouts and of every feature slide (light and dark) are in `docs/screenshots/`; `npm run screenshots` makes them again.

## Offline use

Presenting where there is no internet is a goal of its own. Three ways, from most to least convenient (the full checklist is [docs/OFFLINE.md](docs/OFFLINE.md)):

- `slide-ng build --offline`: a folder that opens by double click on `index.html`, in Chrome or Edge, with no server and no first visit online. Pictures from other servers and web fonts are downloaded into it. The presenter and a second window sync from disk.
- `pwa: true`: the deck stores itself in the browser, but only after **one visit online**; a browser that never opened it cannot get it offline.
- `slide-ng export`: a PDF.

Tested in Chromium only; Firefox and Safari from `file://` are not verified (use `python3 -m http.server` in a normal build for them).

## Remote use

```sh
npm start -- --remote=secret
```

Others on your network can open the deck and follow the presenter. It prints the addresses; the presenter's is `/presenter/1?password=secret`.
The password is optional, as in Slidev: plain `--remote` listens on every address with no password, prints a warning, and still checks the address, origin and session token of every request. There is no HTTPS: use it on a network you trust. Details and the security rules are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Tests

```sh
npm test             # unit tests (generator, code and math handling, click engine, table of contents, shortcuts, transitions)
npm run test:e2e     # builds the starter deck and the showcase, code, interaction and theme decks, and checks them in a real browser
npm run test:dev     # starts the dev server: live updates, v-drag write-back, drawings, side editor, {monaco-write}, --remote password
npm run test:export  # the command line: export (PDF, PNG, PPTX, MD), build, themes, create, the MCP server
```

The browser tests use Chromium through `playwright-core`. Set `CHROME_PATH` if
Chromium is not in `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.

## How it works, in short

1. `scripts/generate.mjs` reads `slides.md` (and files it imports) and splits it into slides with
   Slidev's markdown parser (`@slidev/parser`).
2. Each slide's markdown becomes an Angular template. Angular syntax is
   protected so the markdown converter cannot break it.
3. The generator writes one component per slide into `src/slides/generated/`.
   Those files are not committed.
4. The app (`src/app`) shows one slide per route and handles keys, clicks, transitions,
   scaling and the controls around the slide.

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full picture,
[docs/SYNTAX.md](docs/SYNTAX.md) for how to write slides, and
[docs/DECISIONS.md](docs/DECISIONS.md) for why things are the way they are.
Current state: [docs/STATUS.md](docs/STATUS.md).

## Credits

slide.ng is not a fork of Slidev, but it uses Slidev's published parser
and ports its click logic. See [NOTICE](NOTICE). Licensed under the MIT
license, see [LICENSE](LICENSE).
