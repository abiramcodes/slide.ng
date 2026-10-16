# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to follow [Semantic Versioning](https://semver.org/) once it is published.

## [Unreleased]

### Added

- An agent skill for coding agents (`skills/slide-ng`): `SKILL.md` and one short reference per feature, with a list of what is not supported. `slide-ng skills install [--dir <folder>] [--force]` copies it into a project (`.agents/skills/slide-ng` by default).
- `npm run test:skills` builds every code sample of the skill; `npm run check:skills` fails when a document that the skill was written from changed after the hash recorded in `skills/GENERATION.md` (`npm run update:skills-hash` records new hashes). Both run in CI.
- `docs/AGENT-SKILL.md`.

### Changed

- `--remote` always has a password: when none is given (`--remote=secret`, `SLIDE_NG_PASSWORD`, or a prompt on a terminal), a random one is made and printed with the presenter address. There is no passwordless remote mode any more (this differs from Slidev). The start-up text says what the password allows. Wrong passwords are limited per client address and a login lasts 8 hours.
- `{monaco-write}` saves only into text-like files inside the deck's folder; `setup/`, `layouts/`, `components/`, `.git/`, `node_modules/`, package, lock, config and hidden files are refused.
- Snippets (`<<<`) and `src:` imports must be inside the deck's folder or a theme or addon folder, otherwise the build stops. `allowOutsideRoot: true` in the headmatter lifts that.
- Build-time downloads (`remoteAssets`, `fonts.selfHost`) refuse non-public addresses, follow at most 3 redirects, cap the size, check the file's first bytes and no longer download SVG. `fonts.provider` must be `google`, `coollabs` or `none` unless `fonts.allowCustomProvider: true`.
- `export` keeps Chromium's sandbox; as root or in a container pass `--no-sandbox` (or set `SLIDE_NG_NO_SANDBOX=1`). The exported page cannot reach private addresses unless `--allow-local`.

### Added

- `docs/SECURITY-MODEL.md`, and a non-blocking `npm audit` job in CI.

### Fixed

- Symbolic links: `confine` checks the file itself, writes refuse links, and a symlinked `.slide-ng` is refused. The drawing filter on the server is a parser with an allowlist. The offline cache name changes when a file changes without changing its length.
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
