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
npm start          # dev server at http://localhost:4200, reloads when you edit slides.md
npm run build      # production build in dist/slide-ng/browser
```

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

Not yet: presenter view, drawing, recording, `{monaco-write}`, export. See [docs/STATUS.md](docs/STATUS.md).
Pictures of the layouts and of every feature slide (light and dark) are in `docs/screenshots/`; `npm run screenshots` makes them again.

## Tests

```sh
npm test             # unit tests (generator, code and math handling, click engine, table of contents, shortcuts, transitions)
npm run test:e2e     # builds the starter deck, the layout showcase and the code and content showcase, and checks all three in a real browser
npm run test:dev     # starts the dev server and edits slides.md to check live updates
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
