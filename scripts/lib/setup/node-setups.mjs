// The setup files that run while the slides are generated (in Node): shiki, katex, transformers and preparser.
// Every root (the built-in theme has none, then `theme:`, each addon, the deck) may have `setup/<name>.ts`; they run in that order.
// The browser side setups (main, root, shortcuts, ...) are written into `generated/setup.ts` instead (lib/theme-files.mjs).
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadSetupFunction } from './load-module.mjs';

const EXTENSIONS = ['.ts', '.mts', '.mjs', '.js'];

/** The file of a setup in a folder (`setup/<name>.ts`, `.mts`, `.mjs` or `.js`), or null. */
export function findSetupFile(dir, name) {
  return (
    EXTENSIONS.map((ext) => join(dir, 'setup', `${name}${ext}`)).find((f) => existsSync(f)) ?? null
  );
}

/**
 * Runs `setup/<name>` of every root with `args`. Resolves to their return values (undefined ones kept), in root order.
 * @param {{ id: string, dir: string }[]} roots
 */
export async function runSetups(roots, name, args = []) {
  const results = [];
  for (const root of roots) {
    const file = findSetupFile(root.dir, name);
    if (!file) continue;
    const setup = await loadSetupFunction(file);
    try {
      results.push(await setup(...args));
    } catch (e) {
      throw new Error(`setup/${name} of ${root.id} failed: ${e.message}`, { cause: e });
    }
  }
  return results;
}

/** KaTeX options: every root's object put over the one before (like Object.assign, so a later `macros` replaces an earlier one). */
export async function katexOptions(roots) {
  return Object.assign({}, ...(await runSetups(roots, 'katex')).filter(Boolean));
}

/**
 * The Shiki setups, merged the way Slidev does: options put over each other (later wins), `langs` collected.
 * `langs` entries are language names, grammar objects, or (as an object) `{ name: grammar }`.
 * @returns {{ options: Record<string, any>, langNames: string[], grammars: { name: string, input: any }[] }}
 */
export async function shikiSetup(roots) {
  const returns = (await runSetups(roots, 'shiki', [{}])).filter(Boolean);
  const options = Object.assign({}, ...returns);
  delete options.langs;
  // `theme` and `themes` together: `themes` wins. A `theme` object without a name is the old way to write `themes`.
  if ('theme' in options && 'themes' in options) delete options.theme;
  if (
    options.theme &&
    typeof options.theme === 'object' &&
    !options.theme.name &&
    !options.theme.tokenColors
  ) {
    options.themes = options.theme;
    delete options.theme;
  }
  const langNames = [];
  const grammars = [];
  for (const { langs } of returns) {
    if (langs == null) continue;
    if (Array.isArray(langs)) {
      for (const lang of langs.flat()) {
        if (typeof lang === 'string') langNames.push(lang);
        else if (lang && typeof lang === 'object' && lang.name)
          grammars.push({ name: lang.name, input: lang });
        else
          console.warn(
            '[slides] setup/shiki: a `langs` entry is neither a name nor a grammar with a name, ignored',
          );
      }
    } else if (typeof langs === 'object') {
      for (const [name, grammar] of Object.entries(langs))
        grammars.push({
          name,
          input: typeof grammar === 'function' ? grammar : { ...grammar, name },
        });
    }
  }
  return { options, langNames, grammars };
}

/**
 * The transformer setups. `pre`, `preCodeblock` and `postCodeblock` run on each slide's markdown before it is read
 * (in that order: slide.ng has one pass, so the three are Slidev's names for the same place); `codeblocks` run on each code block.
 * As in Slidev, the markdown lists are joined last root first, `codeblocks` first root first.
 * @returns {{ pre: Function[], codeblocks: Function[] }}
 */
export async function transformersSetup(roots) {
  const returns = (await runSetups(roots, 'transformers')).filter(Boolean);
  const pre = ['pre', 'preCodeblock', 'postCodeblock']
    .flatMap((key) => [...returns].reverse().flatMap((r) => r[key] ?? []))
    .filter(Boolean);
  const codeblocks = returns.flatMap((r) => r.codeblocks ?? []).filter(Boolean);
  return { pre, codeblocks };
}

/**
 * The preparser extensions of every root, for `@slidev/parser`. Each setup gets `{ filepath, headmatter, mode }`
 * and returns a list of `{ name?, transformRawLines?, transformSlide?, transformNote? }`.
 */
export async function preparserExtensions(roots, context) {
  return (await runSetups(roots, 'preparser', [context])).flat().filter(Boolean);
}
