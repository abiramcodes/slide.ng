# Built-in themes

`theme: <name>` looks in this folder first, then in `node_modules` (see docs/THEMES.md and docs/DECISIONS.md). Each folder follows the
theme contract of docs/THEMES.md: `theme.json`, `layouts/`, `components/`, `styles/`.

| Name | Original (MIT, Slidev) | Author | Notes |
| --- | --- | --- | --- |
| `default` | `@slidev/theme-default` | [Anthony Fu](https://github.com/antfu) | Not a folder: it is the built-in look of slide.ng (`src/app/layouts`, `src/styles/layouts.css`). `theme: default` adds nothing. |
| `seriph` | `@slidev/theme-seriph` | [Anthony Fu](https://github.com/antfu) | [seriph/README.md](seriph/README.md) |
| `shibainu` | `@slidev/theme-shibainu` | [iiiiiiinès](https://github.com/iiiiiiines) | [shibainu/README.md](shibainu/README.md) |
| `bricks` | `@slidev/theme-bricks` | [iiiiiiinès](https://github.com/iiiiiiines) | [bricks/README.md](bricks/README.md) |
| `apple-basic` | `@slidev/theme-apple-basic` | [Jeremy Meissner](https://github.com/JeremyMeissner) | [apple-basic/README.md](apple-basic/README.md) |

The code of the originals is MIT licensed and is ported (not copied: the components are new Angular code). Their images and other assets are
CC BY-NC-SA 4.0 (non-commercial) and are **not** included: where an original uses a background picture, the port draws its own CSS gradients.
The decks in `examples/themes/` show every layout of each theme.
