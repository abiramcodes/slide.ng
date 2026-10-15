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
| `layout`       | `default`, `cover`, `center` or `two-cols`. The first slide is `cover` if you set nothing, all others `default`. |
| `class`        | extra CSS (UnoCSS) classes put on the layout element                 |
| `title`        | slide title (otherwise the first `#` heading); shown in the browser tab |
| `hide`, `disabled` | the slide is left out of the deck completely                    |
| `clicksStart`  | first click number of the slide (default 0)                          |

Any other key is kept in the slide's metadata and ignored.

## Notes

The last HTML comment of a slide is its note:

```md
# Slide

<!-- This text is a note. It is stored in the metadata, not shown. -->
```

## Layouts

- `default`: padded, content from the top.
- `cover`: content centred vertically; good for a title slide.
- `center`: everything centred.
- `two-cols`: two columns. A line with only `::right::` starts the second column.

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
