// Folders that slide.ng empties and refills (build output). Slidev's `rm -rf` of a user-given path was a bug
// the maintainers had to fix, so we only ever empty a folder that is new, already empty, or has our marker file,
// which only a previous slide.ng build writes. Everything else is refused with a message.
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, parse, resolve, sep } from 'node:path';

export const MARKER = '.slide-ng-build';

/** Throws when `dir` must not be emptied. `cwd` is the folder the command runs in (it can never be the target). */
export function checkClaimable(dir, cwd = process.cwd()) {
  const path = resolve(dir);
  if (path === parse(path).root)
    throw new Error(`Refusing to use ${path}: it is the root of the file system`);
  if (path === resolve(homedir()))
    throw new Error(`Refusing to use ${path}: it is your home folder`);
  // The project (or a folder above it) would be wiped by a clean build.
  if (resolve(cwd) === path || resolve(cwd).startsWith(path + sep))
    throw new Error(`Refusing to use ${path}: it contains the current folder`);
  if (!existsSync(path)) return;
  if (lstatSync(path).isSymbolicLink())
    throw new Error(`Refusing to use ${path}: it is a symbolic link`);
  if (!lstatSync(path).isDirectory()) throw new Error(`Refusing to use ${path}: it is a file`);
  if (readdirSync(path).length && !existsSync(join(path, MARKER))) {
    throw new Error(
      `Refusing to empty ${path}: it has files and was not made by slide.ng (it has no ${MARKER} file). Choose another folder, or remove it yourself.`,
    );
  }
}

/** Makes `dir` ready for a fresh build: checked, emptied (marker only), created. */
export function claimDirectory(dir, cwd = process.cwd()) {
  checkClaimable(dir, cwd);
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

/** Writes the marker, so the next build may empty this folder. */
export function markDirectory(dir) {
  writeFileSync(
    join(dir, MARKER),
    'This folder is written by slide.ng build and may be emptied by it.\n',
  );
}

/** Copies the content of `from` into `to` after claiming it. */
export function publishDirectory(from, to, cwd = process.cwd()) {
  claimDirectory(to, cwd);
  mkdirSync(dirname(resolve(to)), { recursive: true });
  cpSync(from, to, { recursive: true });
  markDirectory(to);
}
