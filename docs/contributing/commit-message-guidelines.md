# Commit message guidelines

Every commit and every pull request title reads like this:

```
type(scope): summary

Optional body: why the change is needed and how it behaves now.
```

The summary is imperative ("add", not "added"), starts in lower case, has no period at the end and fits in 72 characters. A pull request is squash merged, so its title becomes the commit on the main branch.

## Types

| type       | use it for                                          |
| ---------- | --------------------------------------------------- |
| `feat`     | something new for people who write or present decks |
| `fix`      | a bug fix                                           |
| `perf`     | a change that makes something faster or smaller     |
| `refactor` | code changes that do not change behavior            |
| `test`     | adding or fixing tests only                         |
| `docs`     | documentation only                                  |
| `style`    | formatting only (Prettier), no change in meaning    |
| `build`    | the Angular build, dependencies, `package.json`     |
| `ci`       | workflows, git hooks and other repository tooling   |
| `chore`    | anything else that does not touch the shipped code  |
| `revert`   | undoes an earlier commit; name it in the body       |

## Scopes

The scope says which part changed. It can be left out when a change spans several parts.

| scope        | part                                                       |
| ------------ | ---------------------------------------------------------- |
| `generator`  | `scripts/generate.mjs` and `scripts/lib`                   |
| `layouts`    | layout components in `src/app/layouts`                     |
| `components` | built-in components and directives (`slide-ng-click`, ...) |
| `themes`     | themes, addons and the example theme                       |
| `app`        | the rest of `src/app` (navigation, overview, code, ...)    |
| `presenter`  | presenter view, drawing, recording and sync                |
| `cli`        | `bin/` and `scripts/cli`                                   |
| `dev`        | the dev server in `scripts/dev`                            |
| `export`     | PDF, PNG, PPTX and Markdown export                         |
| `build`      | `slide-ng build` (hosting, PWA, offline folders)           |
| `offline`    | offline use                                                |
| `mcp`        | the MCP server                                             |
| `tests`      | test helpers and suites                                    |
| `docs`       | pages in `docs/` and the README                            |
| `deps`       | dependency updates                                         |
| `ci`         | `.github`, `.githooks` and linting setup                   |

## Rules

- One logical change per commit, and every commit leaves the tests passing.
- Use the body when the reason is not obvious from the summary. Wrap it at about 100 characters.
- Do not add trailer lines (`Co-authored-by:`, `Signed-off-by:` and so on). Mention people in the pull request instead.
- Mark a breaking change with `!` after the scope, for example `feat(cli)!: rename the export flags`, and say what breaks in the body.
- Reference issues in the body, for example `Fixes #123`.

## Checking

`scripts/commit-message.mjs` holds the rules and `.githooks/commit-msg` runs it, but only prints a warning. CI checks the pull request title strictly and the commits as warnings.

```sh
node scripts/commit-message.mjs --title "fix(cli): keep the base path"
node scripts/commit-message.mjs --range origin/main..HEAD
```

To fix the last message, run `git commit --amend`.
