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
