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
