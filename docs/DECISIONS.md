# Decisions

Short notes on choices made, and why. Newest at the bottom.

## Decided before phase 0

- **Plain Angular CLI, latest Angular, no meta-framework.** Fewest moving parts; the default application builder
  (esbuild) and AOT compile slides like any other component.
- **UnoCSS for styling**, Slidev's choice too, so utility class names carry over.
- **Fresh repo, not a fork of Slidev.** Slidev is Vue all the way down; a fork would carry code we do not use.
- **Use Slidev's `@slidev/parser`.** It already handles separators, frontmatter, notes and code fences correctly.
  MIT licensed; credited in README and NOTICE.
- **No converter for Vue syntax.** slide.ng has its own documented, Angular-flavoured syntax (docs/SYNTAX.md).
- **Readable code first.** Small files, short comments that say why, no framework dependencies beyond Angular.

## Made during phase 0

1. **Generator is plain `.mjs` Node scripts, not an Angular schematic or builder.** Easy to read and run;
   `npm run build` is just `generate` then `ng build`. The generated files are git-ignored.
2. **One component per slide, layout chosen at generation time.** The generator knows the layout, so it writes
   `<sn-center>...</sn-center>` and imports that layout. No runtime lookup is needed and AOT can check everything.
3. **Parser entry `@slidev/parser/core`**, not the root export: `core` has no file-system code, so the same
   function runs in the generator and in unit tests.
4. **Imports are decided by looking at the slide's HTML** (`scripts/lib/registry.mjs`), outside code samples.
   A standalone component must import what it uses, and unused imports produce Angular warnings. Adding your own
   component is one line in that table. Trade-off: it is a manual list, not auto-discovery.
5. **Click attribute spelling: `v-click`, `v-after`, `v-click-hide`** (Slidev's names), as inputs with aliases.
   Plain attributes give text (`v-click="+2"`); ranges need a binding (`[v-click]="[2,4]"`). The prototype used
   camelCase names; the dashed names are closer to Slidev and verified to work with Angular bindings.
6. **Code is protected twice**: entities for `{ } @` plus `ngNonBindable`. Entities alone are not enough, because
   Angular decodes them before looking for `{{`.
7. **A lone `@` or brace in normal text is escaped** instead of being an error, so prose like emails works.
   Angular blocks and `@let` must be on their own line.
8. **No per-slide `<script>` block.** Slides share state through template references and `@let`. A scripting
   story is a later phase.
9. **UnoCSS is run from `generate.mjs` with `@unocss/core`, not with the `unocss` command.** The Angular dev server
   does a full page reload whenever the UnoCSS command rewrites its output file (found by testing: 0 of 5 live
   updates). Writing the file only when its content changed gives 5 of 5. Output goes to
   `src/slides/generated/uno.css`, listed in `angular.json` `styles`. A PostCSS plugin was not tried.
10. **Canvas is 960 x 540** (16:9) and scaled with CSS `transform`, using Slidev's formula `min(w/width, h/height)`.
    Slidev's default is 980 wide; 960 is a rounder number and the exact value does not matter.
11. **First slide defaults to `cover`**, like Slidev. `hide`/`disabled` remove a slide at generation time, so slide
    numbers in the URL count only visible slides.
12. **Unit tests use the runner `ng new` sets up (Vitest)**, with `include` extended to `scripts/**/*.spec.ts` and
    `allowJs` so TypeScript specs can import the `.mjs` generator code. Vitest isolates each file.
13. **Browser tests use `playwright-core`** as a dev dependency and a Chromium found through `CHROME_PATH`.
14. **Deck title** in the browser tab is the slide title plus the deck title (headmatter `title`).
15. **Zoneless Angular** (the current CLI default): signals drive the click state.
16. **Eager loading**: every slide is part of the main bundle. Lazy loading per slide is a later optimisation.

## Made during phase 1

1. **`src:` imports use `@slidev/parser/fs` (`load`) in the generator**, `parseDeck` is now async and reads files itself.
   The unit tests still run without files through its `sources` map. The headmatter title falls back to the first slide's title (Slidev does too).
2. **`defaults` from the headmatter are merged under every slide**, first slide included; a slide's own keys win.
3. **A layout's host element is its `.slidev-layout` root**, with Slidev's class names. The DOM matches Slidev (so docs like
   `.two-cols-header { ... }` work) and `class:` lands on the same element as in Slidev.
4. **Layout CSS is plain CSS** (`src/styles/layouts.css`), ported from Slidev's `layouts-base.css` and the default theme with the
   `@apply` lines written out. No UnoCSS transformer is needed and it reads like normal CSS. The Tailwind scale values are written as numbers.
5. **Frontmatter reaches a layout through a table** (`scripts/lib/layouts.mjs`: `props`, `classProp`, `slots`) instead of "everything".
   Layouts with a `class` prop in Slidev (`image-left`, `two-cols`, ...) get the frontmatter `class` as input `contentClass`, because an
   Angular input cannot be called `class`. `layoutClass` is an input of the two-columns layouts.
6. **Slot sugar becomes `<ng-container ngProjectAs="[name]">`**. A slot the layout does not have gives a generator warning and the text
   stays visible in the normal flow (Slidev would drop it silently).
7. **Per-slide `<style>`: Angular `styles` with `ViewEncapsulation.None`, wrapped in `slide-003 { ... }` (CSS nesting).** The slide's tag name is the
   scope, no extra attribute. Unlike Vue's scoped CSS it also reaches inside the layout's own elements, which is what the Slidev docs example needs.
   `--uno:` directives are not supported.
8. **`center` no longer centres the text** (phase 0 did). Slidev's `center` only places the content in the middle; use `class: text-center`.
9. **`full` has no padding.** Slidev's base style would give it the normal padding; the docs say "use all the space of the screen", so we follow the docs.
   This is the one layout where the two disagree; to be checked against a real Slidev (see STATUS).
10. **`<link>` is `<slide-link>`**: `link` is a void HTML element and cannot hold content in an Angular template. Other built-ins keep their Slidev
    names in kebab case (`slide-toc`, `slide-current-no`, `slides-total`, `light-or-dark`, `render-when`). Where Slidev uses Vue slots, we use
    attributes on children: `<div dark>` / `<div light>`, `<div fallback>`, `<div at="2">` inside `<v-switch>`.
11. **`render-when` has no `visible` context** (needs an element visibility observer); `slide`, `presenter`, `print`, `overview`, `main` work.
12. **`Nav` and `Ui` are provided by the Deck component**, not the root, so they can read the route and the slides created inside the deck inherit them.
    Overview thumbnails are created inside the overview component, which is inside the deck, so they see the same services.
13. **Shortcuts are a plain list**, with Slidev's names and keys (`next_space`, `prev_left`, ...), and a `SHORTCUTS_SETUP` injection token
    that gets the default list. We skipped Slidev's key auto-repeat timer (the browser's own key repeat is used) and typing digits in the overview.
14. **Transitions use the Web Animations API**, not CSS classes: no `*-enter-active` classes, so themes written for Vue's classes would not apply.
    The result is easy to test (`getAnimations()`) and needs no CSS. The setting of the earlier slide of the pair is used, like Slidev. Default: none.
15. **The bar at the bottom left shows on hover or focus** (CSS only, as in Slidev's play page). There is no idle timer: Slidev has none either.
    The user's wish for "auto-hide when idle" is met by the bar being hidden until the mouse goes to that corner.
16. **Dark mode** uses Slidev's storage key (`slidev-color-schema`) and values (`auto`, `light`, `dark`), the `dark` class on `<html>`, and hides the
    toggle when `colorSchema` is fixed in the headmatter. There is no inline script against a flash of the wrong colour on load.
17. **Overview thumbnails are real slide components** inside `@defer (on viewport)`, which is the lazy rendering. No image snapshots.
18. **Goto searches with a plain "number starts with / title contains" test**, not Fuse.js (one less dependency).
19. **Settings menu has only "Slide Scale" and "Hide Idle Cursor"** (Slidev also has CSS filters, wake lock and cursor style).
20. **An address that is not a number and not a `routeAlias` shows the `404` layout**; numbers still clamp to the first and last slide (as in phase 0).
    The `error` layout exists but nothing shows it yet.
21. **Icons from `@iconify-json/carbon` through UnoCSS `preset-icons`**, built into the CSS file by the generator (only used icons are included).
    `@unocss/reset` is imported like Slidev does, so layouts start from the same plain page.
22. **Two browser test decks**: the starter deck (`slides.md`, phase 0 tests) and `tests/e2e/showcase/slides.md` (phase 1 tests), built with
    `SLIDES_FILE` into separate folders. `npm run screenshots` writes `docs/screenshots/` from the second one.
23. **The readout `#hud` stays** (tests read it) but is hidden from the eye.
24. **`@types/node`** was added as a dev dependency so the unit tests can use `node:fs` for the `src:` tests.


## Made during phase 2

New dependencies, each with its reason (dev = only used while generating or testing, not in the browser bundle):
`shiki` (dev, highlights code while generating), `katex` (dev, math to HTML while generating; its CSS is added only when used),
`@iconify-json/mdi` and `@iconify-json/ph` (dev, icon data for the generator), `@shikijs/magic-move` (the animation of Magic Move; lazy),
`mermaid` (diagrams; lazy), `monaco-editor` (editor; lazy), `rough-notation` (the `v-mark` drawings; lazy).
Nothing else was added: footnotes, alerts, the PlantUML encoding and the code runner are small hand-written pieces.

1. **Code is highlighted while generating, and the browser gets finished HTML.** Shiki runs in `scripts/lib/code/highlighter.mjs` with both
   themes (`vitesse-light`, `vitesse-dark`, Slidev's defaults) written as CSS variables; `src/styles/code.css` picks one by the `dark` class.
   Headmatter `shiki: { themes: { light, dark } }` changes the themes and `codeAliases: { name: shikiName }` adds language names.
2. **The languages are found before generating** (`features.mjs` scans fences and `<<<` lines), so the highlighter can be synchronous and
   `toTemplate` stays a plain function. A language Shiki does not know is shown as plain text with a warning.
3. **Line highlights are done in the browser, not in the HTML.** The generator writes the ranges as an attribute (`ranges="2-3|5|all"`) and
   `<code-block-wrapper>` toggles `highlighted` / `dishonored` classes from the click number, which is Slidev's design. One code path serves
   static `{2,3}` and click-stepped ranges. A static highlight appears on the first rendered frame after the component starts, not in the HTML.
4. **Fence options are written as plain attributes** (`lines="true" startLine="5" maxHeight="100px"`) and read with Angular's attribute
   transforms. The options text `{lines:true,maxHeight:'100px'}` is read by a small parser (numbers, booleans, quoted text and bare words),
   not evaluated as JavaScript as Slidev does.
5. **`@/` in `<<<` is the folder of the entry markdown file**, like Slidev's `userRoot`. A missing snippet file is a warning plus a visible
   comment inside the block, so one typo does not stop the build.
6. **`::code-group` takes the fences inside it and ignores the text between them.** Tab names are the `[titles]`; the title bar of the single
   blocks is hidden inside a group. Slidev's automatic file icons (vscode-icons) and the `~icon~` title syntax are not drawn.
7. **Fences are found by a small line scanner** (`fences.mjs`) instead of a regular expression, so four backtick fences can hold three backtick
   ones (needed for Magic Move) and `<<<` / `::code-group` are handled in the same pass.
8. **The deck for the phase 2 tests is `tests/e2e/phase2/slides.md`**, next to the phase 1 showcase, with its own runner (`npm run test:e2e`
   runs all three decks). It is the showcase deck the task asks for; the starter `slides.md` stays small.
9. **Magic Move uses `@shikijs/magic-move`** (the package `shiki-magic-move` was renamed; same code, matches Shiki 4). The generator
   tokenises each step (`toKeyedTokens`), compresses the JSON with Node's zlib and writes it into a `steps` attribute. The component unpacks it with
   the browser's `DecompressionStream`, then drives the library's plain DOM renderer (`MagicMoveRenderer`) and `syncTokenKeys`, both loaded with
   dynamic `import()` so they are separate chunks. No lz-string dependency.
10. **A magic-move step's `<<<` snippet lines work** because the inner blocks are read by the same fence scanner.
11. **KaTeX is drawn while generating**, as `output: 'html'` (no MathML), because Angular rejects MathML-only tags such as `<annotation>`.
    The TeX source is added as visually hidden text (`sr-only`) for screen readers instead. Output is wrapped in `ngNonBindable` and has
    `{ } @` as entities. `katex.min.css` (with its fonts) is imported through `src/slides/generated/features.css`, which the generator fills only when a
    deck has math, so other decks carry no KaTeX at all.
12. **Math is cut out of the markdown before Angular syntax is hidden**, so a line that is only `}` inside a formula is not taken for the end of an
    `@if` block. The cost: `{{` inside `$...$` is math, never an interpolation. `$5 and $10` is text (the same rule as Slidev: no space after the opening
    `$`, none before the closing one, and the closing one is not followed by a digit).
13. **Range handling shared by code and math** lives in `code/ranged-block.ts` (`ranges`, `at`, `finally`, `startLine`, `hide`); `CodeBlockWrapper`
    and `KatexBlockWrapper` extend it. `mhchem` (chemistry) is not loaded.
14. **Mermaid is drawn in the browser with `import('mermaid')`**, one diagram at a time (a promise queue), with a cache so overview thumbnails
    do not draw it again. The diagram text travels as a packed attribute (`packed`), because Mermaid syntax has `{{ }}`. `<mermaid code="...">`
    takes plain text for direct use. Options: `scale`, `theme` (no theme means `dark` or `default` following the colour mode, as in Slidev) and any other
    key is passed to `mermaid.initialize` (`config`). The SVG is put in the page directly (not in a shadow root), which keeps CSS simple.
    Mermaid pulls in CommonJS packages; they are listed in `allowedCommonJsDependencies` in `angular.json` to keep the build output free of warnings.
15. **`data-slide-ng-waitfor`** is on a diagram's element while it is still being drawn; its value is the selector that will exist when it is done
    (as Slidev's `data-waitfor` does for its exporter). The attribute is removed when the picture is ready, so "no element has the attribute" means the
    slide is ready for export. (Export itself is a later phase.)
16. **PlantUML is an `<img>`** from `plantUmlServer` (default `https://www.plantuml.com/plantuml`). The generator encodes the text (deflate plus
    PlantUML's base64 alphabet, 15 lines instead of the `plantuml-encoder` package). The deck needs the network for the picture, as in Slidev.
17. **Monaco is bundled by the Angular builder itself, and works offline.** `src/app/code/monaco/setup.ts` is loaded with `import()`;
    it starts Monaco's two workers with `new Worker(new URL(...))` (editor worker and TypeScript worker, small files in `src/app/code/monaco/`),
    which Angular's esbuild builder compiles into separate `worker-*.js` files (`webWorkerTsConfig` in `angular.json`). No AMD loader, no CDN.
    JSON, CSS and HTML get colours but no language server (no workers for them, to keep the output smaller). Setup needed in `angular.json`:
    `"loader": { ".ttf": "file" }` (the icon font) and `webWorkerTsConfig`.
18. **`tsconfig.app.json` lists only `src/main.ts`** (no `include`), so only files the deck imports are compiled. Without this the builder
    found the `new Worker(...)` calls in every file and put 7 MB of workers into every build, also decks without an editor.
19. **Monaco's CSS goes through `features.css` (by path, with its icon font inside) when the deck has an editor.** The CSS that Monaco's JavaScript
    imports is written next to the output as unused `.css` files (about 190 kB each, not linked). Mapping `.css` to `empty` in `angular.json`
    removed them but broke the unit tests, so they stay. Editors use Monaco's own `vs` / `vs-dark` themes following the colour mode, not the Shiki
    themes (that would need `@shikijs/monaco`, one more dependency).
20. **`{monaco-run}` runs code in a sandboxed `<iframe srcdoc sandbox="allow-scripts">`** (no `allow-same-origin`): it cannot reach the slides,
    their storage or cookies; it posts back what `console.log` printed. A run is cut off after 5 seconds. TypeScript is turned into JavaScript by
    Monaco's own TypeScript worker, so the 9 MB `typescript` package is not added a second time. Not supported: `import` in the code (Slidev maps a few
    modules), highlighting of the output (Slidev uses Shiki in the browser), custom runners for other languages.
21. **Keys typed inside a Monaco editor are not shortcuts.** The editor's input is a plain `div`, so the check for text fields in `deck.ts` also looks
    for `.monaco-editor`.
22. **Options after `{monaco}` are flat** (`{autorun:false,showOutputAt:'+1',height:'auto',lines:true,readonly:true}`); `editorOptions` (a nested object) is not read.
    `{monaco-write}` showed an editor without saving in phase 2; phase 3 made it save (see phase 3, decision 17).
23. **Twoslash works, done while generating** with `@shikijs/twoslash` (dev dependency, `explicitTrigger`: only fences with the word `twoslash`
    after the language, as in Slidev). TypeScript worked out the types at generation time, and the popups are CSS only (`style-rich.css` through
    `features.css`), so no TypeScript reaches the browser. It starts a TypeScript program (about one second) only when the deck has a twoslash block.
    A block that fails to compile is shown without types and a warning. Such blocks do not scroll (`overflow: visible`) so popups are not clipped.
    Imports of packages the deck does not install (`import { ref } from 'vue'`) cannot be typed, as in a normal TypeScript program.
24. **Built-in components keep Slidev's names in kebab case**: `<arrow>`, `<auto-fit-text>`, `<transform>`, `<youtube>`, `<tweet>`, `<blue-sky>`,
    `<slide-video>` (Slidev: `SlidevVideo`; `slide-video` keeps clear of `<video>`), `<code-group>`, `<monaco>`, `<mermaid>`, `<plant-uml>`. Multi-word
    inputs that people write in HTML are dashed, like `v-click`: `two-way`, `multi-line`.
25. **`<auto-fit-text>` has no `fitty` dependency.** It tries font sizes between `min` and `max` by halving until the text fits the box's width (and its
    height, when the box has one). A box with no height only limits the width. It fits again when the box is resized and when web fonts have loaded.
26. **`<slide-video>` finds out when it is shown** from the slide number and from a `v-click` on the same element (it injects the `v-click` directive),
    instead of Slidev's global map of click elements. `autoplay`, `autoreset`, `poster`, `timestamp` and `controls` work; the `print*` props do not (no print mode yet).
    In overview thumbnails it never plays.
27. **`<tweet>` and `<blue-sky>` load the sites' own embed scripts** (`platform.twitter.com/widgets.js`, `embed.bsky.app/static/embed.js`) when the component starts,
    so these two need the network at presentation time. The tests answer both scripts with small stand-ins and check the markup and calls. A Bluesky post
    address is turned into an `at://` address with Bluesky's public API, as in Slidev. The Bluesky placeholder uses a Carbon icon (the `simple-icons` set is not installed).
28. **`v-mark` modifiers are rewritten by the generator.** Angular cannot match `v-mark.red.circle` as a directive, so `scripts/lib/directives.mjs` turns it into `mark-mods="red.circle" v-mark="..."`. An object or range value (`v-mark="{ at: 2 }"`, `v-mark="[2, 4]"`) becomes a binding, so Slidev decks keep working. Colours are Tailwind 500 hex values set on rough-notation, not `text-*` classes. `.delay300` is done with a timer, because rough-notation 0.5 has no delay option (Slidev uses its own fork). The drawing is un-scaled by CSS (`--slidev-slide-scale`), because rough-notation measures in screen pixels; stroke width therefore does not follow the slide scale.
29. **`v-motion` is a small CSS-transition directive**, not @vueuse/motion (no new dependency). `:initial`, `:enter`, `:leave` and `:click-N` / `:click-N-M` are collected by the generator into one `[v-motion]` object, since Angular has no dynamic input names. Variants may use x, y, scale, scaleX, scaleY, rotate, opacity, any other CSS property, and `transition: { duration, delay, ease }`. A `v-click` on the same element drives initial / enter / leave. Springs, `hovered`, `tapped`, keyframe arrays and `variants` are not supported (a warning is printed while generating).
30. **Click numbers of `v-mark` follow `v-click`.** A bare `v-mark` is `+1`; `true` always shows, `false` never. In print and overview the end state is not yet special-cased for marks (NOT VERIFIED).
31. **GitHub alerts, footnotes and task lists have no markdown plugin.** Alerts are found in the HTML that `marked` makes (`alerts.mjs`, handles nested quotes), with Carbon icons; footnotes are cut out and written back by `footnotes.mjs` (numbers are plain superscripts, not links, because a `#fragment` link would make the router leave the slide). Task lists are `marked`'s own checkboxes, styled in `src/styles/markdown.css`. The one limit: footnote notes are inline markdown only (no paragraphs or lists inside a note).
32. **Icon tags are rewritten for every installed `@iconify-json/*` set** (`icons.mjs`; the longest set name wins), so adding a set is `npm i -D @iconify-json/<set>` and nothing else. UnoCSS only makes CSS for class names it can see, so the generator now also scans the generated slide files.
33. **Alert colours are GitHub's**, set as CSS variables per kind in `markdown.css`, with a dark variant.


## Made during phase 3

New dependencies, each with its reason: `drauu` (drawing; the brief named it; lazy chunk, only loaded when the toolbar is first opened),
`ws` (dev only: WebSocket server of the companion server; it was already installed through other packages and is now declared),
`@types/ws` (dev: types for the server tests), `yaml` (dev: edits a slide's frontmatter and keeps its comments; the parser already needs it).
Nothing else: recording uses the browser's MediaRecorder, the wake lock uses the browser's Wake Lock, sync uses BroadcastChannel and a plain WebSocket.

1. **Sync is one signal service and a transport interface.** `SyncState` holds `shared` (page, clicks, timer, cursor) and `drawings`. It only knows
   `SyncTransport { send, listen }`; BroadcastChannel and the dev WebSocket are two providers of the multi token `SYNC_TRANSPORTS`. Both can run at once; messages are idempotent, so a double delivery is harmless.
2. **Presenter drives, viewers follow.** The presenter page sends page and clicks; a viewer applies them. A viewer that moves by itself on a local address (localhost, same browser) moves the presenter back,
   so two windows of one person never fight; a viewer on another device only follows. A page that opens late asks with `hello` and the presenter answers. Everything received is cleaned (`cleanShared`): counts must be integers from 0 to under 1e6, drawings at most 500 000 characters.
3. **`/presenter/:no`, `/notes` and `/:no` are separate routes** and `route.data.mode` tells `Nav` which navigation it serves. The three presenter layouts are Slidev's CSS ported; the choice, the notes font size and the cursor options are remembered in `localStorage` under Slidev's keys.
4. **The timer is shared state**, not a local clock: `{ status, startedAt, pausedAt }`, so every window shows the same time. `duration` (`30min`, `1h30min`, `90s`, a number of minutes) and `timer: countdown | stopwatch` are headmatter.
5. **Cursor and laser are drawn on the viewer's page** from the presenter's position in slide coordinates, throttled to one send per animation frame, newest position wins.
6. **Drawings:** one `drauu` instance per page, markup kept in `SyncState.drawings` per slide. Persisted in `localStorage` (`slide-ng-drawings`); with `drawings.persist` the dev server also writes `.slide-ng/drawings/<n>.svg`, and the generator bakes those files into the build.
   `enabled` may be `dev` or `build`; `presenterOnly` hides drawing from viewers; `syncAll: false` keeps viewer drawings on the viewer's screen. Everything read from another window or a file is sanitised (`cleanSvg`, a tag whitelist) before it is shown. The saved SVG file has a fixed viewBox of 960x540 (not the headmatter canvas size).
7. **Recording uses MediaRecorder** (webm, vp9 then vp8 then the browser's choice). `screen` records this tab through `getDisplayMedia`, `camera` records the camera; the microphone is added to both. One file per recording, downloaded when you stop. `fix-webm-duration` was **not** added: the file has no duration field, so some players show it only after a seek.
   `record: true | false | dev | build` (default `dev`, like Slidev) decides whether the camera, record buttons and device options exist at all.
8. **The camera bubble and the screen mirror are small components** (`WebCamera`, `ScreenMirror`); the mirror hides the slide with `display: none`, never removes it, so the click state survives. Device choices are remembered under `slidev-camera`, `slidev-mic`.
9. **Settings menu:** dark mode, slide scale, idle cursor, wake lock, presenter cursor and style, five colour filters (applied to the main slide only, not to thumbnails), camera options, and a **disabled** "Download as PDF" entry (export is not done). The wake lock follows headmatter `wakeLock: true` until the user chooses; the choice wins.
10. **`v-drag` numbers each site in the generator.** `scripts/lib/drag-sites.mjs` finds `v-drag` tags outside code and the generator adds `drag-site="N"`; the dev server uses the same function on the same text, so "site 3" means the same thing on both sides.
    Forms: `v-drag="[x,y,w,h]"`, `v-drag="name"` (numbers in frontmatter `dragPos`), bare `v-drag` (starts where the layout put it, becomes absolute on the first move), `<v-drag pos="x,y,w,h">`, `<v-drag-arrow pos="x1,y1,x2,y2">`.
    Written back as `[x,y,w,NaN]` in the attribute form and `x,y,w,_` in `pos` and frontmatter (`NaN` / `_` = height follows the content), whole numbers only. Resizing ignores the rotation (it works in the unrotated frame). Arrow keys nudge 1 px, with Shift 10 px, and the arrows stop moving slides while an element is selected.
    A static build keeps a move only while the page stays open; it never writes.
11. **`zoom`** scales the layout from the top left corner (width and height divided by the zoom, then `transform: scale`), frontmatter over headmatter. **The default canvas stays 960x540** (phase 1 choice; Slidev's is 980x552); `canvasWidth` and `aspectRatio` change it.
12. **Layers are files:** `src/app/layers/{global-top,global-bottom,slide-top,slide-bottom}.ts`, each with `export default` of a standalone component. The generator imports those that exist into `generated/layers.ts`. Global layers sit once over or under the slides; slide layers are inside every slide. They let clicks through (`pointer-events: none`) and are not drawn in overview thumbnails or the next-step preview.
13. **`routerMode: hash`** uses Angular's hash location; `history` (default) needs a host that sends every path to `index.html`.
14. **The dev companion server is a separate process** (`scripts/dev/server.mjs`), started by `npm start`, bound to **127.0.0.1 only**. The Angular dev server proxies `/__slide-ng/*` to it (`proxy.conf.mjs`), WebSockets included, so the page uses one origin. Even with `--remote` it is only reachable through that proxy, with the same checks.
15. **Security rules of the companion server** (all in `scripts/dev/auth.mjs`, each tested): (a) `Host` must be localhost, or with `--remote` an IP address or the machine's name (stops DNS rebinding); (b) a present `Origin` must equal `Host`; (c) every write and WebSocket needs the session token (random per start, given by `/session`); (d) with a password, also a cookie that is only given for the right password (`HttpOnly`, `SameSite=Strict`, compared in constant time, 400 ms delay on a wrong one);
    (e) writes need `Content-Type: application/json`; (f) a request never supplies a path: slides are found by number through the parser, drawing files are `<integer>.svg`, `{monaco-write}` files come from a list the generator wrote, and every path goes through `confine` (no `..`, no absolute path, no symlink out, inside the deck's folder);
    (g) body limits (slide edits 500 KB, drawings 500 KB, moves 2 KB) answer 413 and hang up; (h) the WebSocket hub passes only `{channel, data}` for three known channels, closes connections over 600 KB, and a bad client cannot stop it; (i) drawing markup must be drawing shapes only (no scripts, handlers, links).
16. **`--remote` always has a password.** `--remote=secret` or, when none is given, a random one is made and printed with the LAN address and the presenter URL (`?password=...`). The page logs in with it, then removes it from the address bar. Without `?password=` the page asks once with a prompt. There is no HTTPS, so on an untrusted network the password and slides cross it in the clear.
17. **`{monaco-write}`** works for `<<< ./file.ts {monaco-write}` (a whole file inside the deck's folder). The generator lists `{ id: path }` in `.slide-ng/monaco-files.json`; the page sends only the id. A region, a plain code block or a file outside the folder gets a warning and a normal editor. The text is saved 600 ms after typing stops.
18. **The side editor is a plain textarea**, not Monaco: it needs no extra loading and cannot fail on a scaled canvas. It shows the raw slide (frontmatter, content, notes) and saves 600 ms after typing. It does not notice edits made elsewhere while it is open (reopen or change slide). Its open state is kept in the browser because a rebuild can reload the page.
19. **Test decks:** `tests/e2e/phase3/slides.md` (presenter, sync, drawing, camera, settings, drag), `tests/e2e/phase3/layout-deck.md` (hash routing, canvas size, zoom and the four layers; the layer files are copied into `src/app/layers` only while it is built), `tests/e2e/dev/slides.md` (copied to `work.md` for the dev-server test).
