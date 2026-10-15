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

Keys: right arrow / space / page down = next click or slide, left arrow / page up = back.
The URL is the state: `/7?clicks=2` is slide 7 at click 2.

## Tests

```sh
npm test             # unit tests (generator and click engine)
npm run test:e2e     # builds, serves dist/ and checks it in a real browser
npm run test:dev     # starts the dev server and edits slides.md to check live updates
```

The browser tests use Chromium through `playwright-core`. Set `CHROME_PATH` if
Chromium is not in `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.

## How it works, in short

1. `scripts/generate.mjs` reads `slides.md` and splits it into slides with
   Slidev's markdown parser (`@slidev/parser`).
2. Each slide's markdown becomes an Angular template. Angular syntax is
   protected so the markdown converter cannot break it.
3. The generator writes one component per slide into `src/slides/generated/`.
   Those files are not committed.
4. The app (`src/app`) shows one slide per route and handles keys, clicks and
   scaling.

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full picture,
[docs/SYNTAX.md](docs/SYNTAX.md) for how to write slides, and
[docs/DECISIONS.md](docs/DECISIONS.md) for why things are the way they are.
Current state: [docs/STATUS.md](docs/STATUS.md).

## Credits

slide.ng is not a fork of Slidev, but it uses Slidev's published parser
and ports its click logic. See [NOTICE](NOTICE). Licensed under the MIT
license, see [LICENSE](LICENSE).
