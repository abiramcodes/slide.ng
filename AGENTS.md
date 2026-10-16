# Repository guide

Short orientation for anyone, human or automated tool, who changes this repository. Details are in [CONTRIBUTING.md](CONTRIBUTING.md) and `docs/`.

slide.ng turns one markdown file (`slides.md`) into an Angular app: the generator writes one standalone component per slide, and Angular compiles them with the rest of the app.

## Map

| path                             | what is there                                                       |
| -------------------------------- | ------------------------------------------------------------------- |
| `scripts/generate.mjs`, `lib/`   | the generator: parsing, markdown to template, imports, CSS, layers  |
| `scripts/cli`, `bin/`            | the `slide-ng` command                                              |
| `scripts/dev`                    | the dev companion server (editing, drawings, sync)                  |
| `scripts/export`, `build`, `mcp` | export, static and offline builds, the MCP server                   |
| `src/app`                        | the Angular app: layouts, click engine, overview, presenter, code   |
| `src/slides/generated`           | written by `npm run generate`; never edit, never commit             |
| `template/`, `examples/`         | the `create` scaffold and the example theme                         |
| `skills/`                        | the agent skill (`slide-ng/`) and `GENERATION.md`, its drift record |
| `tests/e2e`, `tests/export`      | browser, dev server and command line suites                         |
| `docs/`                          | architecture, syntax, themes, setup files, status, decisions        |

## Commands

Use Node 22.22.3 or newer (`.nvmrc` has the version CI uses).

```sh
npm ci                 # install; also turns on the git hooks
npm run lint           # ESLint
npm run format         # Prettier (format:check only checks)
npm run build          # generate, then ng build
npm test               # unit tests
npm run test:e2e       # browser suites, need Chromium (set CHROME_PATH)
npm run test:dev       # dev server suites
npm run test:export    # command line, export and offline suites
npm run test:skills    # builds the code samples of the agent skill
npm run check:skills   # fails when a doc changed after the skill was synced
```

## Rules

- Small files, short plain comments, few dependencies. Record each new dependency and its reason in `docs/DECISIONS.md`.
- Commit messages are `type(scope): summary`, imperative, with no trailer lines (`docs/contributing/commit-message-guidelines.md`).
- Run `npm run lint`, `npm run format:check` and `npm test` before you commit; run the browser suites when you touch the app, the generator, the dev server or export.
- Update `docs/` in the same change as the code. If a document listed in `skills/GENERATION.md` changes, update the skill too, then run `npm run update:skills-hash` (`docs/AGENT-SKILL.md`). State what is not done or not verified in `docs/STATUS.md`.
- Never write secrets, absolute local paths or personal data into the repository.
- Keep the dev server's security rules intact (see SECURITY.md): loopback only, Host and Origin checks, no file names from requests.
- Do not edit `package-lock.json` by hand, and do not publish: the package is private for now.
