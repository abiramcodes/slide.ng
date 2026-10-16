# Signing the history

Commits can carry a signature, which GitHub shows as "Verified". The history of this repository was written without signatures. `scripts/resign-history.sh` signs every commit again.

**Rewriting history changes every commit hash.** Do it once, before anyone else has cloned the repository, and never on a branch other people use. Everyone with a clone must clone again afterwards.

## Set up signing first

With an SSH key (the simplest):

```sh
git config gpg.format ssh
git config user.signingkey ~/.ssh/id_ed25519.pub
git config commit.gpgsign true
```

With GPG, set `user.signingkey` to your key id and `gpg.format` to `openpgp`. Add the public key to your GitHub account under **Settings, SSH and GPG keys**, as a _signing key_.

## Run it

```sh
sh scripts/resign-history.sh
```

The script:

1. stops with a message unless `gpg.format`, `user.signingkey` and `commit.gpgsign` are set, and unless the working tree is clean;
2. makes the branch `backup-unsigned` at the current commit, so you can go back;
3. runs `git rebase --root --rebase-merges --exec "git commit --amend --no-edit -S"`;
4. prints `git log --format=%G? | sort | uniq -c`. `G` is a good signature, `N` is none, `E` means the key cannot be checked (add your key to `gpg.ssh.allowedSignersFile` for SSH keys).

Then push once with `git push --force-with-lease`. To go back, `git reset --hard backup-unsigned`.

The script has been tried only on its refusal path. Run it on a copy of the repository first.
