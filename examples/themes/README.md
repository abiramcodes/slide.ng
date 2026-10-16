# Theme showcase

One deck per official theme, with a slide for every layout the theme provides. Each deck starts with `theme: <name>`; nothing is installed.

```sh
node bin/slide-ng.mjs examples/themes/bricks.md          # dev server
node bin/slide-ng.mjs build examples/themes/seriph.md    # static site
```

| Deck | Theme | Slides |
| --- | --- | --- |
| `seriph.md` | [seriph](../../themes/seriph) | 7 |
| `shibainu.md` | [shibainu](../../themes/shibainu) | 14 |
| `bricks.md` | [bricks](../../themes/bricks) | 9 |
| `apple-basic.md` | [apple-basic](../../themes/apple-basic) | 11 |

The decks load the theme fonts from Google Fonts, so they look right with a network. `npm run test:e2e` builds and checks all four (`tests/e2e/themes.mjs`).
`default` is the built-in look: any deck without `theme:` shows it.
