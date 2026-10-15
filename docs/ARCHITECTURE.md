# Architecture

slide.ng has two halves: a **generator** (plain Node scripts, runs before Angular) and a
small **Angular app** (shows the generated slides).

```
slides.md
   |  scripts/generate.mjs
   v
src/slides/generated/        <- not committed
   slide-001.ts ... slide-010.ts   one standalone Angular component per slide
   index.ts                        list of slides + metadata (title, layout, note, frontmatter)
   uno.css                         CSS for the UnoCSS classes in use
   |
   v  ng build / ng serve  (normal Angular CLI, AOT)
dist/slide-ng/browser
```

## The generator (`scripts/`)

| file | job |
| ---- | --- |
| `generate.mjs` | entry point: read `slides.md`, write the generated files, optional `--watch` |
| `dev.mjs` | `npm start`: run the generator in watch mode next to `ng serve` |
| `lib/parse-deck.mjs` | split `slides.md` into slides using `@slidev/parser`; drop `hide`/`disabled` slides |
| `lib/to-template.mjs` | one slide's markdown -> Angular template string |
| `lib/emit.mjs` | write the TypeScript source of a slide component and of `index.ts`; wrap in the layout |
| `lib/registry.mjs` | tables of known layouts and components |
| `lib/make-css.mjs` | build UnoCSS output for the class names found |

### Why placeholders in `to-template.mjs`

Markdown converters would damage Angular syntax (`@if (x) {` is a paragraph to them, `[a]="b"`
may be changed). So the generator replaces each piece of Angular syntax by a harmless word,
runs the converter, and puts the original text back. Code fences and inline code are set aside
the same way and written out escaped, with `ngNonBindable`, so `{{ x }}` inside code stays text.
Remaining `{`, `}` and `@` in normal text become HTML entities.

### Layout wrapping

Slidev wraps every slide in its layout with a Vite plugin (`layoutWrapper.ts`). We do it in the
generator: the slide's template is `<sn-center class="..."> ...content... </sn-center>` and the
slide component imports `CenterLayout`. Layouts are ordinary standalone components in
`src/app/layouts/` that use `<ng-content />`. `two-cols` uses `<ng-content select="[right]" />`.

## The app (`src/app/`)

| file | job |
| ---- | --- |
| `deck.ts` | the route `/:no`: creates the slide component, handles keys, `?clicks=` in the URL, canvas scaling |
| `lib/canvas.ts` | fixed 960x540 canvas and the scale formula `min(w/960, h/540)` |
| `lib/clicks.ts` | `ClicksContext`: per-slide click state (current, total, relative/absolute/range maths) |
| `lib/v-click.ts` | the `v-click`, `v-after`, `v-click-hide` directive |
| `lib/v-clicks.ts` | the `<v-clicks>` component for lists |
| `lib/slide-base.ts` | base class of generated slides (gives them their `ClicksContext`) |
| `lib/slide-meta.ts` | type of one entry in the generated index |
| `lib/counter.ts` | example custom component |
| `layouts/*.ts` | the four layouts |

### Clicks

Every slide component lists `ClicksContext` in its `providers`, so each slide has its own state.
Every element with `v-click` registers itself when it is created. Angular creates directives in template
order, and that order is what makes `+1` (relative) work: each element asks "what is the sum of the
steps before me?". When the slide has rendered, the context knows the largest click number: the
slide's `total`. `current` is a signal clamped between `clicksStart` and `total`, and each element
turns the signal into CSS classes (`slidev-vclick-hidden` hides it). The deck moves the click
forward on the right arrow, and goes to the next slide when the clicks are used up.

### Navigation

The deck keeps one slide on screen. When the route number changes it clears the container and creates the new
slide component (a fresh `ClicksContext`). `?clicks=N` is read when the slide is created and written back
with `history.replaceState` as clicks change.

## Styling

UnoCSS, with `@unocss/core` and the `wind3` preset, called from `generate.mjs`. It reads `slides.md` and
`src/app/**/*.ts` and writes `src/slides/generated/uno.css`, which is a global style in `angular.json`.
`src/styles.css` holds the page frame, slide typography and the click classes.

## Tests

- `scripts/lib/*.spec.ts` and `src/app/lib/*.spec.ts`: unit tests run by `ng test` (Vitest).
- `tests/e2e/run.mjs`: builds, serves `dist/`, drives Chromium (`playwright-core`).
- `tests/e2e/dev-hmr.mjs`: dev server live-update check.
