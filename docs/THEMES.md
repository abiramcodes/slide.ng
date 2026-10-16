# Themes and addons: the contract

A theme or addon is a folder (or an npm package) that adds to the built-in look. This page is the reference; the step-by-step
guide is [WRITING-A-THEME.md](WRITING-A-THEME.md). The working example is [`examples/theme-minimal`](../examples/theme-minimal).

## Using one

```yaml
---
theme: ./my-theme          # a folder next to the deck, an absolute path, or a package name
addons:
  - ./my-addon
  - slide-ng-addon-charts
---
```

- `theme: default` (or `none`, or no `theme:`) is the built-in theme.
- A name that is not a path is looked up in `node_modules` (from the deck's folder upwards) as `slide-ng-theme-<name>`, then as `<name>`.
  Addons use `slide-ng-addon-<name>`, then `<name>`.
- A path that is not a folder is an error, and so is a package name that is not installed, as in Slidev: the build stops with
  `The theme "x" was not found. Install it with: npm install -D slide-ng-theme-x` (`pnpm add -D` or `yarn add -D` when the deck has that lock file).
  In a terminal, `dev` and `build` ask first whether to install it now. A name with a slash (`themes/mine`) is a path, `@/themes/mine` is relative to the deck's folder.
- `SLIDE_NG_THEME=<name|path>` in the environment overrides the headmatter (the generator reads it).
- `slide-ng theme eject` copies the theme in use into `./theme` and sets `theme: ./theme` (see below).

## The roots, and who wins

Each of these is a "root". Later roots win over earlier ones, file by file and name by name:

1. the built-in theme (`src/app`, always there)
2. `theme:`
3. each of `addons:`, in order
4. the deck's own folder (the folder of the entry file)

So a deck can put a `layouts/cover.ts` next to `slides.md` and it beats the theme's cover. The deck's folder is only searched for the
folders listed below; the rest of it (your markdown, `node_modules`, ...) is never copied.

## What a root can contain

| Folder or file | What it does |
| --- | --- |
| `layouts/<name>.ts` | A layout. `<name>` is what a slide writes in `layout:`. The same name replaces a built-in layout. |
| `components/*.ts` | Components that slides can use as tags. Found by their `selector`. |
| `layers/<name>.ts` | A layer component: `global-top`, `global-bottom`, `slide-top`, `slide-bottom` (default export). |
| `styles/index.css` | CSS. Added after the app's styles, so it can override them. |
| `public/` | Files served from the site root (`/logo.png`). Merged; the later root wins on the same name. |
| `setup/providers.ts` | Angular providers (default export: an array). See "Setup hooks". |
| `uno.config.mjs` | UnoCSS settings (default export). Merged into the app's: `presets`, `rules`, `safelist`, `variants` are added; `shortcuts` and `theme` are merged key by key. |
| `theme.json` | Name, default headmatter and layout inputs. See below. |

### Layouts

A layout is a standalone Angular component with a `selector` and an exported class. The generator finds it by reading the file as text
(`@Component({ ... selector: '...' ... }) export class Name`), so keep the selector as a string literal. Slide content goes into
`<ng-content />`. A layout that replaces a built-in one **keeps the built-in layout's inputs** (for example `cover` keeps `background`):
the frontmatter keys that are inputs become attributes of your tag, so give your component inputs of the same names. To change the list,
use `theme.json`.

### Components

Every exported component with a selector in `components/` is available. A component is imported into a slide only when the slide's
markup contains `<selector`. Giving a component the same class name as a built-in one replaces it.

### Importing from the app

Theme code is copied into the app before it is compiled, so it cannot use `../` to reach the app. Use the path alias `slide-ng/`:

```ts
import { ClicksContext } from 'slide-ng/lib/clicks';
import { SHORTCUTS_SETUP } from 'slide-ng/lib/shortcuts';
```

`slide-ng/<path>` means `src/app/<path>`. Angular and other packages are imported as usual.

### `theme.json`

```json
{
  "name": "minimal",
  "headmatter": { "colorSchema": "dark", "transition": "fade" },
  "layouts": { "quote": { "props": ["author"], "slots": [], "classProp": false } }
}
```

- `headmatter`: defaults for the deck. The deck's own headmatter wins. `defaults:` (the frontmatter every slide starts from) is merged key by key.
- `layouts.<name>`: `props` are the frontmatter keys that become inputs, `slots` are the names accepted after `::name::`,
  `classProp: true` sends the slide's `class` to the input `contentClass` instead of the tag.

## Setup hooks

`setup/providers.ts` default-exports an array of Angular providers. They are added to the application, so a theme can use any token the app injects:

| Token | From | Use |
| --- | --- | --- |
| `SHORTCUTS_SETUP` | `slide-ng/lib/shortcuts` | A function `(actions, list) => list`: add, change or remove keyboard shortcuts. One provider is used; the last root that provides it wins. |
| `CODE_RUNNERS` | `slide-ng/code/runners` | `{ provide: CODE_RUNNERS, multi: true, useValue: { javascript: (code) => result } }`: replace how `{monaco-run}` runs a language. The key is Monaco's language id (`javascript`, `typescript`). |
| `SYNC_TRANSPORTS` | `slide-ng/sync/transport` | Another way to carry presenter sync (multi). |

## `slide-ng theme eject`

```sh
slide-ng theme eject [slides.md] [--dir theme]
```

Copies the theme in use into `./theme` and sets `theme: ./theme`. For the built-in theme this copies every layout (their imports
are rewritten to `slide-ng/...`) and the layouts' CSS as `styles/index.css`. For a package it copies the whole package folder without
`node_modules`, `.git` and symbolic links. It refuses a folder that is not empty.

## How it works (for debugging)

The generator copies each root's folders into `src/slides/generated/roots/<id>/` and merges the `public/` folders into
`src/slides/generated/public/`. It writes `layers.ts`, `setup.ts` (the providers) and `theme.css` (the `@import`s of the styles).
Symbolic links are never copied. In dev mode the folders of themes and addons are watched, so an edit regenerates and reloads.

## Limits

- No theme gallery, no versioning or compatibility check between a theme and the app.
- A layout's inputs are not read from the component (Angular decorators are not parsed): they come from the built-in layout or `theme.json`.
- Class names in a theme are found by UnoCSS in `.ts` files of the roots and in the deck's markdown, not in CSS files.
- Slidev themes are not compatible (they are Vue). Only the folder names are alike.
