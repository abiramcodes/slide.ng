#!/bin/sh
# Signs every commit of the current branch again (see docs/SIGNING.md).
# This rewrites history: all commit hashes change. A branch called backup-unsigned keeps the old one.
set -eu

fail() {
  echo "resign-history: $1" >&2
  exit 1
}

git rev-parse --git-dir >/dev/null 2>&1 || fail "this is not a git repository."

format="$(git config --get gpg.format || true)"
key="$(git config --get user.signingkey || true)"
sign="$(git config --get commit.gpgsign || true)"

if [ -z "$key" ] || [ "$sign" != "true" ] || [ -z "$format" ]; then
  echo "resign-history: commit signing is not set up, so nothing was changed." >&2
  echo "  gpg.format       = ${format:-(not set)}   (ssh or openpgp)" >&2
  echo "  user.signingkey  = ${key:-(not set)}" >&2
  echo "  commit.gpgsign   = ${sign:-(not set)}   (must be true)" >&2
  echo "Set them as docs/SIGNING.md describes, then run this script again." >&2
  exit 1
fi

[ -z "$(git status --porcelain)" ] || fail "the working tree is not clean. Commit or stash your changes first."
git rev-parse --verify --quiet backup-unsigned >/dev/null &&
  fail "the branch backup-unsigned already exists. Rename or delete it first."

git branch backup-unsigned
echo "Saved the current history as the branch backup-unsigned."

git rebase --root --rebase-merges --exec "git commit --amend --no-edit -S"

echo "Signature status of every commit (G = good, N = none, E = key cannot be checked):"
git log --format=%G? | sort | uniq -c
