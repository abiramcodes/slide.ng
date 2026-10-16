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
| `lib/make-css.mjs` | build UnoCSS output for the class names found |

### Why placeholders in `to-template.mjs`

Markdown converters would damage Angular syntax (`@if (x) {` is a paragraph to them, `[a]="b"`
may be changed). So the generator replaces each piece of Angular syntax by a harmless word,
runs the converter, and puts the original text back. Code fences and inline code are set aside
the same way and written out escaped, with `ngNonBindable`, so `{{ x }}` inside code stays text.
Remaining `{`, `}` and `@` in normal text become HTML entities.

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
| `lib/canvas.ts` | fixed 960x540 canvas and the scale formula `min(w/960, h/540)` |
| `lib/clicks.ts` | `ClicksContext`: per-slide click state (current, total, relative/absolute/range maths) |
| `lib/v-click.ts`, `v-clicks.ts`, `v-click-gap.ts`, `v-switch.ts` | click directives and components |
| `lib/slide-base.ts`, `slide-meta.ts` | base class of generated slides; type of an index entry |
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
- `tests/e2e/dev-hmr.mjs`: dev server live-update check.
- `tests/e2e/screenshots.mjs`: not a test; writes `docs/screenshots/`.
