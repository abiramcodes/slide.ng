// The `.slide-ng` folder of a deck holds what the tools write (the working copy of the app, build output, drawings, the
// list of editable files) and then empty again. A deck that ships `.slide-ng` as a symbolic link to another folder would make
// the tools write into, and delete from, that folder. So the link is refused, and every recursive removal first
// checks that the real place of the path is inside the folder it is meant for.
import { lstatSync, realpathSync, rmSync, unlinkSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';

export const TOOL_DIR = '.slide-ng';

/** The deck's `.slide-ng` path. Throws when it exists as a symbolic link or as something that is not a folder. */
export function checkToolDir(deckRoot) {
  const dir = join(resolve(deckRoot), TOOL_DIR);
  let stat;
  try {
    stat = lstatSync(dir);
  } catch {
    return dir; // it does not exist yet: the tools make it
  }
  if (stat.isSymbolicLink())
    throw new Error(
      `Refusing to use ${dir}: it is a symbolic link, so the tools would write into and delete from the folder it points to. Remove the link and run again.`,
    );
  if (!stat.isDirectory()) throw new Error(`Refusing to use ${dir}: it is not a folder`);
  return dir;
}

/** Throws when `path` exists as a symbolic link (a folder the tools own must be a real folder). */
export function refuseLink(path) {
  try {
    if (lstatSync(path).isSymbolicLink())
      throw new Error(`Refusing to use ${path}: it is a symbolic link`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

/**
 * Removes `path` (a file or a folder with everything in it) when its real place is inside the real place of `root`.
 * A symbolic link is only unlinked (what it points to is never touched). A path that does not exist is fine.
 */
export function removeInside(path, root) {
  let stat;
  try {
    stat = lstatSync(path);
  } catch {
    return;
  }
  if (stat.isSymbolicLink()) {
    unlinkSync(path);
    return;
  }
  const rel = relative(realpathSync(root), realpathSync(path));
  if (!rel || rel.startsWith('..') || isAbsolute(rel))
    throw new Error(`Refusing to delete ${path}: it is not inside ${root}`);
  rmSync(path, { recursive: true, force: true });
}
