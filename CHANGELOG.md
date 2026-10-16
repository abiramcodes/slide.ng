# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to follow [Semantic Versioning](https://semver.org/) once it is published.

## [Unreleased]

### Added

- An agent skill for coding agents (`skills/slide-ng`): `SKILL.md` and one short reference per feature, with a list of what is not supported. `slide-ng skills install [--dir <folder>] [--force]` copies it into a project (`.agents/skills/slide-ng` by default).
- `npm run test:skills` builds every code sample of the skill; `npm run check:skills` fails when a document that the skill was written from changed after the hash recorded in `skills/GENERATION.md` (`npm run update:skills-hash` records new hashes). Both run in CI.
- `docs/AGENT-SKILL.md`.

### Changed

- **Built-in names have the library prefix `slide-ng-`.** The Vue-style `v-*` names and the short element names are gone, with no aliases. The generator stops with `renamed to slide-ng-...` when a slide still uses an old one. The rule and the full table are in `docs/RENAMES.md`.

  | old                                                                                                                           | new                                                                                                                                                                                    |
  | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `v-click`, `v-after`, `v-click-hide`                                                                                          | `slide-ng-click`, `slide-ng-after`, `slide-ng-click-hide`                                                                                                                              |
  | `v-mark`, `v-motion`, `v-drag`                                                                                                | `slide-ng-mark`, `slide-ng-motion`, `slide-ng-drag`                                                                                                                                    |
  | `<v-clicks>`, `<v-click-gap>`, `<v-switch>`                                                                                   | `<slide-ng-clicks>`, `<slide-ng-click-gap>`, `<slide-ng-switch>`                                                                                                                       |
  | `<v-drag>`, `<v-drag-arrow>`                                                                                                  | `<slide-ng-drag>`, `<slide-ng-drag-arrow>`                                                                                                                                             |
  | `<slide-toc>`, `<slide-current-no>`, `<slides-total>`, `<slide-link>`, `<slide-video>`                                        | `<slide-ng-toc>`, `<slide-ng-current-no>`, `<slide-ng-total>`, `<slide-ng-link>`, `<slide-ng-video>`                                                                                   |
  | `<light-or-dark>`, `<render-when>`, `<arrow>`, `<transform>`, `<auto-fit-text>`                                               | `<slide-ng-light-or-dark>`, `<slide-ng-render-when>`, `<slide-ng-arrow>`, `<slide-ng-transform>`, `<slide-ng-auto-fit-text>`                                                           |
  | `<youtube>`, `<tweet>`, `<blue-sky>`                                                                                          | `<slide-ng-youtube>`, `<slide-ng-tweet>`, `<slide-ng-blue-sky>`                                                                                                                        |
  | `<mermaid>`, `<plant-uml>`, `<monaco>`, `<code-group>`, `<code-block-wrapper>`, `<shiki-magic-move>`, `<katex-block-wrapper>` | `<slide-ng-mermaid>`, `<slide-ng-plant-uml>`, `<slide-ng-monaco>`, `<slide-ng-code-group>`, `<slide-ng-code-block-wrapper>`, `<slide-ng-magic-move>`, `<slide-ng-katex-block-wrapper>` |

  Layout names, frontmatter keys, CSS classes, `$clicks`-style variables and the `::code-group` block are unchanged. The runtime classes and files follow (`VClick` is `SlideNgClick`).

### Fixed

- `docs/SYNTAX.md` explained custom components, layers and shortcuts as changes inside `src/app`; a deck uses `components/`, `layers/` and `setup/shortcuts.ts`. `docs/PARITY.md` said 22 layouts; there are 21.

## [0.1.0] - unreleased

The first version, built in phases. Nothing is published yet.

### Added

- Phase 0, the core: one `slides.md` is split with Slidev's parser, and each slide becomes a standalone Angular component compiled ahead of time. Routing, keyboard navigation, scaling on a 16:9 canvas, UnoCSS styling and unit tests.
- Phase 1, Slidev's slide features: all layouts with the same names and props, slots, clicks (`v-click`, `v-after`, `v-clicks`, `v-switch`), transitions, the navigation bar, overview, table of contents, `src:` imports, headmatter defaults and speaker notes.
- Phase 2, content: Shiki code with line highlights stepped by clicks, snippets, code groups, Magic Move, Twoslash, KaTeX, Mermaid, PlantUML, Monaco editors, built-in components, `v-mark`, icons as tags, alerts and footnotes.
- Phase 3, presenting: presenter view, notes, timer, laser pointer, synced windows, drawing, camera and screen recording, `v-drag` written back into the markdown, layers, and the dev companion server with its security rules.
- Phase 4, tooling: export to PDF, PNG, PPTX and Markdown, static, base-path and offline builds, an install-and-go PWA mode, themes and addons, setup files, the `slide-ng` command with `create`, `format` and `theme eject`, and an MCP server.
- Repository files for open source hosting: contribution guides, issue and pull request templates, CI workflows, linting, formatting, git hooks and commit message checks.

### Known gaps

See `docs/STATUS.md` for what is missing or not verified.

[Unreleased]: https://github.com/slide-ng/slide.ng/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/slide-ng/slide.ng/commits/main
