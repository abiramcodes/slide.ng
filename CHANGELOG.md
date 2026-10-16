# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to follow [Semantic Versioning](https://semver.org/) once it is published.

## [Unreleased]

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
