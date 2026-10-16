# Writing a theme

A theme in five steps. The rules are in [THEMES.md](THEMES.md); `examples/theme-minimal` is a finished small theme.

## 1. Make the folder

```
my-theme/
  theme.json
  layouts/
  components/
  styles/index.css
```

Put it next to your deck and write `theme: ./my-theme` in the first headmatter. Start with only the parts you need.

## 2. Replace a layout

`my-theme/layouts/quote.ts`:

```ts
import { Component } from '@angular/core';

@Component({
  selector: 'my-quote',
  host: { class: 'slidev-layout my-quote' },
  template: '<div class="my-quote-body"><ng-content /></div>',
})
export class MyQuote {}
```

Any slide with `layout: quote` now uses it. The selector must be a plain string, and the class must be exported.

If your layout reads frontmatter (`author: Ada`), give the component an input of that name and list it in `theme.json`:

```json
{ "layouts": { "quote": { "props": ["author"] } } }
```

## 3. Add a component

`my-theme/components/callout.ts` with `selector: 'my-callout'`. Slides can write `<my-callout>text</my-callout>`; the generator
imports it into every slide that uses the tag.

## 4. Add CSS

`my-theme/styles/index.css` is plain CSS and comes after the app's CSS. UnoCSS classes work in the layouts and components too, and
`uno.config.mjs` can add shortcuts:

```js
export default { shortcuts: { 'my-muted': 'op60 text-sm' } };
```

## 5. Default settings

`theme.json` can set headmatter defaults, such as `"colorSchema": "dark"` or the fonts (`"fonts": { "sans": "Titillium Web", "mono": "Fira Code" }`,
loaded from the provider, merged with the deck's own `fonts`). Pictures go in `public/`.
The official themes (the slide.ng-themes repository, `packages/theme-*`) are larger examples: `bricks` has components, `apple-basic` has layouts with props, `shibainu` has many layouts.

## Extra: setup hooks

`setup/providers.ts` can change shortcuts, or the way code editors run code. The example theme adds a `b` key (back one slide):

```ts
import { SHORTCUTS_SETUP } from 'slide-ng/lib/shortcuts';
export default [
  {
    provide: SHORTCUTS_SETUP,
    useValue: (actions, list) => [...list, { name: 'back', key: 'b', run: actions.prevSlide }],
  },
];
```

## Sharing it

A theme is a folder, so publish it as an npm package with these folders at the top of the package. Users install it and write `theme: <name>`.
slide.ng looks for the name in `node_modules` as `@slide-ng/theme-<name>`, then `slide-ng-theme-<name>`, then `<name>`, so name your package
`slide-ng-theme-<name>` (or `@your-scope/...`, used as `theme: @your-scope/theme-x`). The package needs nothing slide.ng reads except the folders:

```json
{
  "name": "slide-ng-theme-ocean",
  "version": "1.0.0",
  "license": "MIT",
  "keywords": ["slide-ng-theme", "slide-ng"],
  "files": ["layouts", "components", "styles", "public", "setup", "theme.json"],
  "peerDependencies": { "@slide-ng/core": "*" }
}
```

The official packages follow this layout; see the slide.ng-themes repository and its CONTRIBUTING.md for adding one. Start from the built-in look
instead of from nothing with `slide-ng theme eject`.

## Checking your theme

Run the deck with `slide-ng` and edit the theme: the folders are watched. Run `slide-ng build` to see the real build (it fails on
a template error in a layout). The repository's own test for the example theme, also installed as a fake `@slide-ng/theme-demo` package to prove the lookup in `node_modules`, is `tests/export/theme.mjs`.
