# Architecture

slide.ng has two halves: a **generator** (plain Node scripts, runs before Angular) and a
small **Angular app** (shows the generated slides).

```
slides.md  (+ files it imports with `src:`)
   |  scripts/generate.mjs
   v
src/slides/generated/        <- not committed
   slide-001.ts ... slide-NNN.ts   one standalone Angular component per slide
   index.ts                        list of slides + metadata, headmatter, info html
   uno.css                         CSS for the UnoCSS classes in use
   |
   v  ng build / ng serve  (normal Angular CLI, AOT)
dist/slide-ng/browser
```

## The generator (`scripts/`)

| file | job |
| ---- | --- |
| `generate.mjs` | entry point: read the deck, write the generated files, optional `--watch`. `SLIDES_FILE=path` builds another deck (tests do) |
| `dev.mjs` | `npm start`: run the generator in watch mode next to `ng serve` |
| `lib/parse-deck.mjs` | read the deck with `@slidev/parser` (`load`: follows `src:` imports), merge headmatter `defaults` |
| `lib/layouts.mjs` | table of the 21 layouts (component, props, slots) and `layoutName` (fallback with a warning) |
| `lib/slots.mjs` | `::name::` slot sugar: cut a slide's markdown into slots |
| `lib/scoped-style.mjs` | pull `<style>` blocks out of a slide and scope them to the slide |
| `lib/to-template.mjs` | one piece of markdown -> Angular template string |
| `lib/emit.mjs` | TypeScript source of one slide component |
| `lib/index-source.mjs` | TypeScript source of `index.ts` |
| `lib/registry.mjs` | table of components that slides can use (and re-export of the layouts) |
| `lib/make-css.mjs` | build UnoCSS output for the class names found (deck, generated slides and `src/app`) |
| `lib/fences.mjs` | line scanner that finds code fences, `<<<` snippet lines and `::code-group`, and leaves a placeholder for each |
| `lib/code/meta.mjs` | reads a fence's info string: language, `[title]`, `{ranges}`, `{options}` |
| `lib/code/highlighter.mjs`, `render-code.mjs` | Shiki (both themes as CSS variables) and the HTML of one highlighted block (with Twoslash) |
| `lib/code/render-fence.mjs` | decides what a fence becomes: code, group, magic move, mermaid, plantuml or Monaco |
| `lib/code/snippet.mjs`, `magic-move.mjs`, `diagrams.mjs`, `plantuml.mjs`, `monaco.mjs` | one job each; see the file headers |
| `lib/math.mjs` | cuts `$...$` and `$$...$$` out of the markdown and renders them with KaTeX |
| `lib/features.mjs` | scans the deck for what it uses (languages, math, Monaco, Magic Move, Twoslash) |
| `lib/directives.mjs`, `icons.mjs`, `alerts.mjs`, `footnotes.mjs` | Vue-style `v-mark` / `v-motion` attributes, icon tags, GitHub alerts and footnotes |
| `lib/pack.mjs` | JSON -> deflate -> base64, so text with `{{ }}` can travel in an attribute (the browser has `code/unpack.ts`) |
| `lib/protect.mjs` | the entity escaping for `{ } @` and the `attr()` helpers |

### Why placeholders in `to-template.mjs`

Markdown converters would damage Angular syntax (`@if (x) {` is a paragraph to them, `[a]="b"`
may be changed). So the generator replaces each piece of Angular syntax by a harmless word,
runs the converter, and puts the original text back. Code fences and inline code are set aside
the same way and written out escaped, with `ngNonBindable`, so `{{ x }}` inside code stays text.
Remaining `{`, `}` and `@` in normal text become HTML entities.

### Code, math and other fences

Fences are cut out first (`fences.mjs`) and written back last (`code/render-fence.mjs`). Syntax is coloured by Shiki while generating,
so the browser gets finished HTML inside `<code-block-wrapper>`. That component only adds behaviour: line numbers, the copy button, and the
highlight ranges, which are an attribute (`ranges="2-3|5"`) turned into classes by the current click. `RangedBlock` is the base class that code and
math blocks share. Anything with text that Angular would read as a binding (Magic Move steps, Mermaid, Monaco) is passed `pack()`ed.

`features.mjs` scans the deck before generating, and `generate.mjs` writes `src/slides/generated/features.css` with only the stylesheets that deck needs
(KaTeX, Magic Move, Twoslash, Monaco). Heavy code (Monaco, Mermaid, Magic Move, rough-notation) is reached only through `import()`, so it is a lazy chunk;
`tsconfig.app.json` lists only `src/main.ts` so that unused features (and Monaco's workers) are not compiled into decks that do not use them.
The starter test checks that the output of a deck without them contains none of their code.

### Rewrites before markdown

Before the markdown converter runs, `to-template.mjs` rewrites Vue-style syntax into plain Angular: `v-mark.red="1"` becomes
`mark-mods="red" v-mark="1"`, the `:initial` / `:click-N` attributes of `v-motion` become one `[v-motion]="{ ... }"` binding (Angular has no
dynamic input names), and `<carbon-apps />` becomes `<span class="i-carbon:apps"></span>`. After it: alerts are found in the HTML, and footnotes are listed at the end.

### Layout wrapping and slots

Slidev wraps every slide in its layout with a Vite plugin. We do it in the generator: the slide's
template is `<sn-two-cols ...props>...content...</sn-two-cols>` and the slide component imports the layout.
Frontmatter keys that the layout lists in `layouts.mjs` (`image`, `url`, ...) become attributes, which are the
layout's inputs. A layout's host element is its `.slidev-layout` root, like in Slidev, so `class:` lands on it.

`::name::` lines cut the slide into slots (`slots.mjs`). Each named slot becomes
`<ng-container ngProjectAs="[name]">...</ng-container>`, and the layout has `<ng-content select="[name]" />`.

### Per-slide style

The `<style>` text goes into the slide component's `styles`, wrapped in `slide-003 { ... }` with
`ViewEncapsulation.None`. The slide's own tag name is the scope and CSS nesting does the rest.

## The app (`src/app/`)

| file | job |
| ---- | --- |
| `deck.ts` | the route `/:no`: stage and canvas, keys, mouse, `?clicks=` in the URL; hosts the controls |
| `lib/nav.ts` | `Nav`: current slide, next/prev/go, table of contents, address -> slide (number or `routeAlias`) |
| `lib/stage.ts` | puts slides on the canvas and plays transitions (two slides in the page while it runs) |
| `lib/transitions.ts` | which transition applies, and the animation of each (Web Animations) |
| `lib/shortcuts.ts` | list of `{ name, key, run, when }`, the default keys, `SHORTCUTS_SETUP` to change them |
| `lib/actions.ts` | connects shortcut names to what they do |
| `lib/ui-state.ts` | `Ui`: which dialog or menu is open, slide scale, overview highlight |
| `lib/dark.ts`, `lib/fullscreen.ts`, `lib/idle-cursor.ts` | dark mode, fullscreen, hide idle cursor |
| `lib/mount-slide.ts`, `lib/slide-context.ts` | create a slide component and tell it its number and where it is drawn |
| `lib/toc-tree.ts` | pure functions: table of contents tree and its filters |
| `lib/canvas.ts` | canvas size (960x540, or headmatter `canvasWidth` / `aspectRatio`), `zoom`, the scale formula `min(w/width, h/height)` |
| `lib/clicks.ts` | `ClicksContext`: per-slide click state (current, total, relative/absolute/range maths) |
| `lib/v-click.ts`, `v-clicks.ts`, `v-click-gap.ts`, `v-switch.ts` | click directives and components |
| `lib/slide-base.ts`, `slide-meta.ts` | base class of generated slides; type of an index entry |
| `code/*.ts` | `code-block-wrapper`, `code-group`, `magic-move`, `katex-block`, `mermaid`, `plant-uml`, `monaco-editor` (+ `code-runner`); `monaco/` holds the lazy Monaco setup, its two workers and the sandbox runner |
| `lib/v-mark.ts`, `mark-options.ts` | `v-mark` directive (rough-notation, lazy) and the pure option reader |
| `lib/v-motion.ts`, `motion-style.ts` | `v-motion` directive and the pure variant maths |
| `builtin/*.ts` (phase 2) | `arrow`, `transform`, `auto-fit-text`, `youtube`, `slide-video`, `tweet`, `blue-sky` |
| `layouts/*.ts` | one small component per layout (`background.ts` and `frame.ts` are helpers) |
| `builtin/*.ts` | `slide-toc`, `slide-link`, `slide-current-no`, `slides-total`, `light-or-dark`, `render-when` |
| `ui/*.ts` | nav bar, context menu, overview and thumbnail, goto box, info dialog, settings menu, icon button |

### Clicks

Every slide component lists `ClicksContext` in its `providers`, so each slide has its own state.
Every element with `v-click` registers itself when it is created. Angular creates directives in template
order, and that order is what makes `+1` (relative) work: each element asks "what is the sum of the
steps before me?". When the slide has rendered, the context knows the largest click number: the
slide's `total` (or the `clicks:` frontmatter value). `current` is a signal clamped between `clicksStart` and `total`,
and each element turns the signal into CSS classes (`slidev-vclick-hidden` hides it).

### Navigation and state

`Deck` provides `Nav` and `Ui` for itself, so everything inside it (controls, and the slides, which are created
inside it) can inject them. The URL is the state: `/7?clicks=2`. When the route changes the deck asks `Stage`
to show the slide: the old slide is removed (or animated away), a new component is created with a fresh `ClicksContext`.
`?clicks=N` is read when the slide is created and written back with `history.replaceState` as clicks change.
Slides get their number and render context (`slide`, `overview`) from two injection tokens, which is how
`<slide-current-no>` and `<render-when>` know where they are.

### Overview

`ui/overview.ts` draws one `ui/thumbnail.ts` per slide inside `@defer (on viewport)`, so slides far down the page are
only created when scrolled to. A thumbnail is the real slide component, set to its last click and scaled with CSS.

### Transitions

`Stage.show()` creates the new slide before removing the old one. For `slide-*` and `fade*` both elements get a
Web Animation (`translate` / `opacity`, from Slidev's `transitions.css`) and the old one is destroyed when both are done.
`view-transition` calls `document.startViewTransition` around the swap. A new navigation during an animation finishes
the running one at once.

## Presenter, sync and interaction (phase 3)

| folder | job |
| ------ | --- |
| `sync/` | `SyncState` (signals `shared` and `drawings`), the `SyncTransport` interface, `BroadcastTransport`, `nav-sync.ts` (presenter drives, viewers follow), `shared-state.ts` (cleaning of everything received) |
| `presenter/` | `/presenter/:no` and `/notes` pages, timer, notes with click markers, next-step preview, clicks slider, presenter cursor and laser, `PresenterPrefs` |
| `drawing/` | drauu wrapper `Drawings`, toolbar, layer, sanitiser, persistence (localStorage, dev files) |
| `record/` | `Devices`, `Recorder` (MediaRecorder), camera bubble, recording buttons, screen mirror |
| `drag/` | `v-drag` directive, `<v-drag>`, `<v-drag-arrow>`, the handles (`drag-controls.ts`), pure math (`drag-math.ts`) |
| `dev/` | only active in a dev build: `DevApi`, WebSocket transport, side editor, drawing upload |
| `scripts/dev/` | the companion server (below) |

### Sync

`SyncState` owns two signals and sends changes through every provided `SYNC_TRANSPORTS` entry; it never knows how messages travel.
Three channels exist: `shared` (page, clicks, timer, cursor), `drawings` and `hello`. Everything received passes `cleanShared` / `cleanDrawings` first.
`startNavSync(nav)` runs on the deck and presenter pages: the presenter's page and clicks are sent, a viewer applies what arrives (an effect keyed on page, clicks and a `lastUpdate` stamp, so an echo is ignored).
`Nav.ready` and `setContext(no, clicks)` make sure the click count sent belongs to the slide that is really on screen. Adding a transport means one more provider; the dev build adds the WebSocket one.

### Dev companion server and its security

`npm start` runs three processes: the generator in watch mode, `scripts/dev/server.mjs` and `ng serve`. The companion binds to 127.0.0.1 and `ng serve` proxies `/__slide-ng/*` to it (`proxy.conf.mjs`, WebSockets too).
`npm start -- --remote[=password]` makes only `ng serve` listen on 0.0.0.0 and prints the LAN and presenter addresses.

```
browser --/__slide-ng/*--> ng serve (0.0.0.0 with --remote) --proxy--> companion (127.0.0.1)
                                                                        check: Host, Origin, cookie, token
```

| file | job |
| ---- | --- |
| `auth.mjs` | `check` (Host, Origin, password cookie, token), `confine` (path inside the deck folder), `readBody` (size limit), constant-time compare |
| `routes.mjs` | the HTTP routes: `/session`, `/login`, `/slides/:n/drag`, `/slides/:n/source`, `/drawings/:n`, `/monaco/:id` |
| `slide-source.mjs` | pure text edits of one slide inside its file (drag positions, frontmatter `dragPos`, whole-slide replace) |
| `slides-write.mjs` | finds the slide and its file with the parser, then writes |
| `drawings-store.mjs`, `monaco-write.mjs` | drawing files (`<integer>.svg`), listed `{monaco-write}` files |
| `ws-hub.mjs` | passes `{channel, data}` between connected pages |

Rules, each covered by tests (`server.spec.ts`, `auth.spec.ts`, `tests/e2e/dev-server.mjs`):
the server listens on loopback only; `Host` and `Origin` are checked for every request and every WebSocket upgrade; writes need the random session token and a JSON content type;
with a password the cookie is needed too; a request never names a file (slide number through the parser, `<integer>.svg`, a generator-written id list) and every path is confined to the deck folder
(`..`, absolute paths and symlinks out are refused); bodies and WebSocket messages have size limits; drawing markup is checked against a shape whitelist.
Writes run one after another so two quick edits cannot overwrite each other. The generator watches the markdown, so a written change comes back as a rebuild.

### v-drag, layers and canvas

The generator numbers every `v-drag` (`drag-sites.mjs`) and adds `drag-site="N"`. In the browser the directive reads the place (inline text, or a name looked up in the slide's frontmatter `dragPos`),
puts the element at it and, on a move, tells `DragState`, which keeps the place for this visit and hands it to the dev server's saver. `generated/layers.ts` imports the layer files that exist;
`app-slide-layer` shows one. `zoom` is a CSS variable on the slide element and one rule in `styles.css`.

## Styling

UnoCSS, with `@unocss/core`, the `wind3` preset (dark variant by class) and `preset-icons` with the Carbon set
(`i-carbon:maximize` and friends, like Slidev), called from `generate.mjs`. It reads the deck and `src/app/**/*.ts` and
writes `src/slides/generated/uno.css`, which is a global style in `angular.json`. `src/styles.css` imports the UnoCSS
reset and `src/styles/` (variables, the layouts' typography ported from Slidev's theme, buttons) and holds the page frame and click classes.

## Tests

- `scripts/lib/*.spec.ts` and `src/app/**/*.spec.ts`: unit tests run by `ng test` (Vitest).
- `tests/e2e/run.mjs`: builds the starter deck `slides.md`, serves `dist/`, drives Chromium (`playwright-core`): navigation and clicks.
- `tests/e2e/showcase.mjs` + `showcase/`: builds `tests/e2e/showcase/slides.md` (every layout, TOC, built-ins, transitions, `src:` import)
  into `dist/showcase` and checks layouts, controls, shortcuts, transitions and built-ins.
- `tests/e2e/phase2.mjs` + `phase2/`: builds `tests/e2e/phase2/slides.md` (every code and content feature) into `dist/phase2` and runs one file per topic
  (`code`, `magic`, `math`, `diagrams`, `monaco`, `twoslash`, `components`, `mark`, `markdown`). `node tests/e2e/phase2.mjs mark` runs one topic.
  It answers the PlantUML server and the tweet / Bluesky scripts with stand-ins, so no network is needed.
- `tests/e2e/phase3.mjs` + `phase3/`: builds `tests/e2e/phase3/slides.md` and `layout-deck.md`, one file per topic (`sync`, `presenter`, `laser`, `drawing`, `camera`, `settings`, `drag`, `layout`), with Chromium's fake camera and microphone.
- `tests/e2e/dev-hmr.mjs`: dev server live-update check. `tests/e2e/dev-server.mjs`: starts the real dev server on a small deck: v-drag write-back, drawings, side editor, `{monaco-write}`, refused requests, and `--remote` with a password (HTTP, WebSocket, two browsers).
- `tests/e2e/screenshots.mjs` and `screenshots-features.mjs`: not tests; write `docs/screenshots/` (layouts, controls, and every feature slide).
