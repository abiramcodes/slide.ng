// Files that a deck reads (`<<<` snippets, `src:` imports, the MCP `get_slide` tool) must be inside the deck's folder or
// inside a theme or addon folder, judged by their real place (a symlink that leads out does not count as inside).
// A deck can say `allowOutsideRoot: true` in its own headmatter to read from anywhere; a theme or addon cannot set it for the deck.
import { existsSync, realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';

export class OutsideRootError extends Error {
  constructor(what, path) {
    super(
      `${what} "${path}" is outside the deck's folder. Move the file into the deck, or set allowOutsideRoot: true in the headmatter if you trust it (docs/SECURITY-MODEL.md).`,
    );
    this.name = 'OutsideRootError';
  }
}

/** The real path of `path`, also when the file does not exist yet (the closest folder that exists is resolved). */
function realish(path) {
  const full = resolve(path);
  if (existsSync(full)) return realpathSync(full);
  const parent = dirname(full);
  if (parent === full) return full;
  return join(realish(parent), basename(full));
}

/** True when the real place of `path` is one of `roots` or inside one. */
export function insideRoots(path, roots) {
  let real;
  try {
    real = realish(path);
  } catch {
    return false;
  }
  return roots.some((root) => {
    let realRoot;
    try {
      realRoot = realish(root);
    } catch {
      return false;
    }
    const rel = relative(realRoot, real);
    return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
  });
}

/** `allowOutsideRoot` is read from the deck's own headmatter, only a real `true` counts. */
export const allowsOutsideRoot = (headmatter) => headmatter?.allowOutsideRoot === true;

/** Throws an OutsideRootError unless `path` may be read. `what` names the thing (for the message). */
export function assertReadable(path, what, { roots, allowOutsideRoot = false }) {
  if (allowOutsideRoot || insideRoots(path, roots)) return;
  throw new OutsideRootError(what, path);
}
