# Writing slides

All slides live in one file, `slides.md`.

## Slides and frontmatter

A line with only `---` separates slides. A block of YAML between two `---`
lines at the top of a slide is that slide's frontmatter.

```md
---
title: My talk          # headmatter: frontmatter of the first slide, describes the deck
---

# First slide

---
layout: center
class: text-red-500
---

# Second slide
```

Keys slide.ng understands:

| key            | what it does                                                        |
| -------------- | ------------------------------------------------------------------- |
| `layout`       | one of the layouts below. The first slide is `cover` if you set nothing, all others `default`. |
| `class`        | extra CSS (UnoCSS) classes on the layout (on the content for layouts that have a `class` prop, see Layouts) |
| `title`        | slide title (otherwise the first `#` heading); used in the browser tab, the table of contents and the goto box |
| `level`        | depth in the table of contents (otherwise the number of `#` in the first heading) |
| `hideInToc`    | leave this slide out of `<slide-toc>`                                |
| `routeAlias`   | an extra address: `routeAlias: intro` makes `/intro` open this slide  |
| `hide`, `disabled` | the slide is left out of the deck completely                    |
| `clicksStart`  | first click number of the slide (default 0)                          |
| `clicks`       | fixes the number of clicks of the slide, whatever its elements ask for |
| `transition`   | transition to the next slide, see Transitions                        |
| `src`          | take the slides from another markdown file, see Importing slides      |
| `image`, `url`, `scale`, `backgroundSize`, `background`, `layoutClass` | props of some layouts |

In the headmatter (the frontmatter of the first slide) you can also set:

| key            | what it does                                                        |
| -------------- | ------------------------------------------------------------------- |
| `title`        | deck title (browser tab, info dialog)                                |
| `info`         | markdown text shown in the info dialog                               |
| `colorSchema`  | `auto` (default: follow the system, the user can toggle), `light` or `dark` (fixed, no toggle) |
| `transition`   | the transition of every slide that sets none                         |
| `defaults`     | frontmatter that every slide starts from, e.g. `defaults: { layout: center }`; a slide's own keys win |

Any other key is kept in the slide's metadata and ignored.

## Importing slides

```md
---
src: ./pages/intro.md
class: from-here
---
```

The slide is replaced by the slides of that file. A range after `#` picks some of them:
`src: ./pages/intro.md#2,4-6`. Keys set on the importing slide win over the imported ones.
The text of the importing slide is ignored. A missing file or a circular import is reported when
the slides are generated, and the slide is skipped.

## Notes

The last HTML comment of a slide is its note:

```md
# Slide

<!-- This text is a note. It is stored in the metadata, not shown. -->
```

## Layouts

All layouts of Slidev, with the same names and props (see `docs/screenshots/` for pictures).

| layout | use | props (frontmatter) |
| ------ | --- | ------------------- |
| `default` | normal content | |
| `cover` | title slide | `background` (colour or image, dimmed) |
| `intro` | introduce the talk | |
| `center` | content in the middle of the screen (add `class: text-center` to centre the text too) | |
| `section` | start of a new section | |
| `statement` | a statement as the main content | |
| `fact` | one big fact or number | |
| `quote` | a quotation | |
| `end` | last slide; shows `END` when empty | |
| `full` | content uses the whole screen, no padding | |
| `none` | no styling at all | |
| `image` | an image as the whole slide | `image`, `backgroundSize` |
| `image-left`, `image-right` | image on one side, content on the other | `image`, `backgroundSize`, `class` (goes to the content) |
| `iframe` | a web page as the whole slide | `url`, `scale` |
| `iframe-left`, `iframe-right` | web page on one side | `url`, `scale`, `class` (goes to the content) |
| `two-cols` | two columns, slots `::left::` (also the default text) and `::right::` | `class` (both columns), `layoutClass` (the whole layout) |
| `two-cols-header` | a header, two columns and a bottom row: `::left::`, `::right::`, `::bottom::`; the text before the first marker is the header | `class`, `layoutClass` |
| `404`, `error` | shown when an address matches no slide, or a slide fails | |

`image` is an address (`/photo.png` is served from the `public/` folder) or a colour for the
background. An unknown layout name prints a warning that lists the names and uses `default`.

### Slots: `::name::`

A line with only `::name::` starts a named part of the slide that a layout can place somewhere:

```md
---
layout: two-cols
---

# Left (the default slot)

::right::

# Right
```

`::default::` goes back to the default part, so parts can be written in any order. If the layout
has no slot with that name, a warning is printed and the text stays in the normal flow.

## Per-slide styles

A `<style>` block in a slide applies to that slide only:

```md
# Red title

<style>
h1 { color: red; }
</style>
```

The CSS is placed inside the slide's own element with native CSS nesting (`slide-003 { ... }`), so every
selector only matches inside that slide, layout elements included (`.two-cols-header { column-gap: 20px }` works).
Nested rules and `&` work. UnoCSS directives (`--uno: ...`) do not; use utility classes in the HTML instead.

## Transitions

```md
---
transition: slide-left
---
```

`slide-left`, `slide-right`, `slide-up`, `slide-down` (these go the other way when you move backwards),
`fade`, `fade-out`, `view-transition` (the browser's View Transitions API; no animation in browsers without it).
`transition: slide-left | slide-right` gives the forward and the backward variant yourself.
Like Slidev, the transition set on a slide is used between that slide and the next one (in both directions).
Set `transition` in the headmatter for the whole deck. The default is no transition.
The duration is the CSS variable `--slidev-transition-duration` (0.5s). While a transition runs the class
`slidev-nav-go-forward` or `slidev-nav-go-backward` is on the stage, so `forward:text-red` and `backward:text-red` classes work.

## Clicks

Clicks reveal things step by step. Add these to any HTML element:

```md
<div v-click>Shows on the next click</div>
<div v-click="3">Shows at click 3 (a number means "the click with this number")</div>
<div v-click="+2">Shows two clicks after the previous element</div>
<div [v-click]="[2, 4]">Shows from click 2 until click 4, then hides</div>
<div v-after>Shows together with the element before it</div>
<div v-click="2" v-click-hide>Visible first, hides at click 2</div>
```

Two forms exist because of how Angular reads attributes:

- `v-click="3"` or `v-click="+2"` is plain text; slide.ng turns it into a number or a relative step.
- `[v-click]="[2, 4]"` is an Angular binding; use it for ranges and for any value you compute.

List items one by one:

```md
<v-clicks>

- first
- second

</v-clicks>
```

Leave an empty line after `<v-clicks>` and before `</v-clicks>`, otherwise markdown does not
turn the list into HTML. Options: `depth="2"` (include nested lists), `every="2"` (items per click),
`at="3"` (first click), `hide` (items hide instead of show).

## Built-in components

Available in every slide without importing anything.

| tag | what it does |
| --- | ------------ |
| `<slide-toc />` | table of contents from the slides' `title` and `level`. Options: `columns="2"`, `listClass="..."`, `start="1"`, `listStyle="..."`, `minDepth`, `maxDepth`, `mode="all\|onlyCurrentTree\|onlySiblings"` |
| `<slide-current-no />` | the number of the slide it is on |
| `<slides-total />` | the number of slides |
| `<slide-link to="3">text</slide-link>` | a link to slide 3, or to a `routeAlias`. (Called `slide-link` because `link` is a built-in HTML tag.) |
| `<light-or-dark>` | shows `<div dark>...</div>` in dark mode and `<div light>...</div>` in light mode |
| `<render-when context="slide">` | content only where the slide is drawn: `slide`, `presenter`, `print`, `overview`, or `main` (slide or presenter). `[context]="['slide','overview']"` takes several. Content marked `<div fallback>` shows everywhere else |
| `<v-switch>` | one child per click: `<v-switch><div at="1">a</div><div at="2">b</div><div at="3-5">c</div></v-switch>` (a number lasts until the next one starts, `3-5` is explicit) |
| `<v-click-gap size="2" />` | leaves two clicks empty |
| `<v-clicks>`, `v-click`, `v-after` | see Clicks |

The table of contents lists every slide that has a title and is not `hideInToc`. A slide whose level is higher than the one
before it becomes its child: `# A`, `## A.1`, `## A.2`, `# B` gives A (with A.1, A.2) and B. In `mode="onlyCurrentTree"` only the path to
the current slide (and what is below it) is shown, `onlySiblings` shows the lists that contain the current slide.

## Angular in markdown

Normal Angular template syntax works:

```md
Total: {{ items.length }}

@if (n > 5) {
Big number.
}

<my-chart [data]="values" (picked)="x = $event" />
```

Rules, so the markdown converter does not break your Angular code:

- `@if`, `@for`, `@switch` ... lines (`@name ( ... ) {`) and the closing `}` or `} @else {` must be on their own line.
- `@let name = value;` must be on its own line.
- A tag that uses a binding, event, `#ref` or `*directive` is passed through untouched. Put it on its own line,
  or inline in a paragraph.
- `{{ ... }}` is passed through untouched.
- A single `{`, `}` or `@` in normal text (like an email address) is safe: it is escaped for you.
- Slides have no component class of their own. To share state between parts of a slide use template
  references (`<app-counter #c />` then `{{ c.n() }}`) or `@let`.

## Showing code that contains braces

Code fences and inline code are always plain text. Nothing inside them is read as Angular:

````md
```ts
const o = { a: 1 }; // @Component {{ x }}
```

Inline too: `{{ x }}` and `@if`.
````

## Using your own components

Write a standalone Angular component, then add one line to `COMPONENTS` in
`scripts/lib/registry.mjs` (class name, file under `src/app/`, and a pattern that finds
its tag). The generator then imports it into every slide that uses it. See
`src/app/lib/counter.ts` and its entry for an example.

## Styling

Use [UnoCSS](https://unocss.dev) utility classes (Tailwind-like names) in HTML and in `class:`
frontmatter. The CSS for the classes you use is built automatically.

## Keys, mouse and the interface

| key | action |
| --- | ------ |
| right, space, page down | next click, or next slide |
| left, shift + space, page up | previous click, or previous slide |
| down, shift + right | next slide (skips the clicks) |
| up, shift + left | previous slide |
| `f` | fullscreen |
| `o` or backtick | slide overview (arrows move, Enter opens, Escape closes) |
| `d` | dark / light |
| `g` | go to a slide: type a number or part of a title, Enter |
| Escape | close the overview, dialogs and menus |

The bar at the bottom left (fullscreen, previous, next, overview, dark mode, drawing, presenter mode, info, settings, counter)
shows when the mouse is there. Drawing and presenter mode are disabled placeholders for now. Right click opens a menu with the same actions;
hold Shift while right clicking for the browser's own menu. Click the dark area beside the slide: right half = next, left half = previous.

Change the keys by providing `SHORTCUTS_SETUP` in `src/app/app.config.ts`. It gets the default list and returns the list to use:

```ts
import { SHORTCUTS_SETUP } from './lib/shortcuts';

providers: [
  { provide: SHORTCUTS_SETUP, useValue: (actions, list) => [
      ...list.filter((s) => s.name !== 'next_space'),               // remove one
      { name: 'my_next', key: 'n', run: () => actions.next() },    // add one
  ] },
]
```

Dark mode follows the system until the user presses `d` or the sun/moon button; the choice is kept in the browser
(`localStorage`, key `slidev-color-schema`). `colorSchema: light` or `dark` in the headmatter fixes it and hides the button.
Dark styles for your own markup: UnoCSS `dark:` classes work (`dark:text-white`).
