# Agent skill

`skills/slide-ng` is an agent skill for coding agents that write or change slide.ng decks. It is a folder in the common `SKILL.md` format: a main file with the quick start, the syntax and a table of topics, and one short reference per topic in `references/`.

## Install it in a deck

```sh
slide-ng skills install                        # .agents/skills/slide-ng in the current folder
slide-ng skills install --dir tools/skills     # tools/skills/slide-ng
slide-ng skills install --force                # replace an earlier copy
```

- `--dir` is the folder that holds skills; the skill itself goes in `<dir>/slide-ng`. The default is `.agents/skills`.
- It never overwrites: an existing `slide-ng` folder is an error unless `--force` is given, and `--force` only replaces a folder whose `SKILL.md` is this skill.
- It never writes outside the project (the current folder): a `--dir` that leads out, also through a symbolic link, is refused.
- The skill is part of the package (`files` in `package.json`), so an installed `slide-ng` has it. Decks made with `slide-ng create` mention it in their README.

Point your agent tooling at the installed folder if it does not look in `.agents/skills` by itself.

## What is in it

- `SKILL.md`: when to use it, quick start with the real commands (dev server on port 4230) and a check for each, basic syntax, rules for agents, tables that link every reference.
- `references/`: grouped by prefix: `core-`, `animation-`, `code-`, `diagram-`, `layout-`, `presenter-`, `build-`, `export-`, `theme-`, `setup-`, `offline-`, `mcp-`. They cover the features marked done in [PARITY.md](PARITY.md) and the syntax in [SYNTAX.md](SYNTAX.md). Slide.ng is Angular, so they say where Slidev (Vue) habits fail (`core-slidev-differences.md`), and `not-supported.md` lists what does not exist so that an agent does not invent it.

## Keeping it true

Two checks, both in CI:

- **Samples build.** A fenced `md` block after `<!-- verify -->` is a complete deck or slides. `npm run test:skills` (`tests/skills/verify-samples.mjs`) generates each one in a temporary deck with the real generator (an error or a `[slides]` warning fails it) and then builds all of them together with `slide-ng build`, so Angular compiles every template. `<!-- verify-file: path -->` before a fence puts a file (a component, snippet, setup or theme file) next to the samples of the same page. Fragments that cannot stand alone carry no marker. `--each` builds every sample alone (slow); `--only <text>` picks samples.
- **No drift.** `skills/GENERATION.md` lists the documents each skill file was written from and their SHA-256. `npm run check:skills` fails (exit code 1, with the stale files and the changed documents) when a document changed after the recorded hash. After you re-read the changed document and updated the skill, `npm run update:skills-hash` records the new hashes.

When you add a feature: document it in `docs/`, update the reference (or add one, with a row in `SKILL.md` and in `GENERATION.md`), run `npm run test:skills`, then `npm run update:skills-hash`.

## Not covered

The skill is written by hand from the documents, not generated. Samples prove that decks build, not that they look right; features that need a network, a browser or a real device are described, not run. See [STATUS.md](STATUS.md) for what is not verified in slide.ng itself.
