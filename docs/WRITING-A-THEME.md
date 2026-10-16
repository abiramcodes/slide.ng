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

`theme.json` can set headmatter defaults, such as `"colorSchema": "dark"`. Pictures go in `public/`.

## Extra: setup hooks

`setup/providers.ts` can change shortcuts, or the way code editors run code. The example theme adds a `b` key (back one slide):

```ts
import { SHORTCUTS_SETUP } from 'slide-ng/lib/shortcuts';
export default [{ provide: SHORTCUTS_SETUP, useValue: (actions, list) => [...list, { name: 'back', key: 'b', run: actions.prevSlide }] }];
```

## Sharing it

A theme is a folder, so publish it as a package named `slide-ng-theme-<name>` with these folders at the top of the package. Users install it
and write `theme: <name>`. Start from the built-in look instead of from nothing with `slide-ng theme eject`.

## Checking your theme

Run the deck with `slide-ng` and edit the theme: the folders are watched. Run `slide-ng build` to see the real build (it fails on
a template error in a layout). The repository's own test for the example theme is `tests/export/theme.mjs`.
