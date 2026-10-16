# Security policy

## Supported versions

slide.ng is young and not published to npm yet. Only the latest commit on the main branch is supported. There are no older lines to patch.

## Report a vulnerability

Use GitHub's private vulnerability reporting: open the repository's **Security** tab and choose **Report a vulnerability**
(<https://github.com/slide-ng/slide.ng/security/advisories/new>). Please do not open a public issue for a security problem.

Say which version or commit you used, how you ran slide.ng (dev server, `--remote`, a built deck, the MCP server), what you did and what happened. A small reproduction helps.

This is a small project kept up in spare time, so there is no fixed response time. Expect an answer within a few days. A confirmed problem is fixed in the next release, and the advisory credits you unless you prefer not to be named.

## What the dev server protects

`npm start` runs a small companion server next to the Angular dev server. It reads and writes files in your deck folder (drag positions, the side editor, drawings, `{monaco-write}` files), so it follows these rules. Each one has tests, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

- It listens on 127.0.0.1 only. `--remote` opens the Angular dev server to the network, never the companion directly; requests reach it through the dev server's proxy.
- Every request and every WebSocket upgrade has its `Host` and `Origin` checked.
- Writes need the random session token and a JSON content type. With a password set, the login cookie is needed as well.
- A request never names a file. Slides are found by number through the parser, drawings are `<integer>.svg`, and `{monaco-write}` files come from a list the generator wrote. Every path stays inside the deck folder; `..`, absolute paths and symlinks that leave it are refused.
- Request bodies and WebSocket messages have size limits, and drawing markup is checked against a list of allowed shapes.
- There is no HTTPS. Plain `--remote` has no password and prints a warning, so use it only on a network you trust.

Code that runs in a slide, such as `{monaco-run}`, runs in the browser's sandbox. A deck is code: do not build or serve a deck you do not trust.
