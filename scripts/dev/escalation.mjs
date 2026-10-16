// A page or a tool that edits slides must not be able to widen what the next build reads or downloads. Settings that do that
// (`allowOutsideRoot`, `fonts.allowCustomProvider`) can be switched on only by editing the file yourself. The check reads the
// deck as it would be after the edit, so a different spelling of the key (quoted, escaped, in a flow mapping) is seen as well.
import { readFileSync } from 'node:fs';
import { parseDeck } from '../lib/parse-deck.mjs';
import { OutsideRootError } from '../lib/outside-root.mjs';
import { HttpError } from './http-error.mjs';

const WIDENING = [
  ['allowOutsideRoot', (deck) => deck.allowOutsideRoot === true],
  ['fonts.allowCustomProvider', (deck) => deck.headmatter.fonts?.allowCustomProvider === true],
];

/** The names of the widening settings that `after` has on and `before` did not. */
export const newlyEnabled = (before, after) =>
  WIDENING.filter(([, on]) => on(after) && !on(before)).map(([name]) => name);

/**
 * Throws an HttpError (422) when writing `text` into `file` would turn a widening setting on.
 * @param {{ entry: string }} ctx
 */
export async function assertNoWidening(ctx, file, text) {
  const before = await parseDeck(ctx.entry);
  let after;
  try {
    after = await parseDeck(ctx.entry, { [file]: text });
  } catch (e) {
    if (e instanceof OutsideRootError) throw new HttpError(422, e.message);
    // Text that does not parse (half-typed frontmatter) can still be saved, but not if it mentions a widening setting.
    const mentions = (t) => (t.match(/allowOutsideRoot|allowCustomProvider/gi) ?? []).length;
    if (mentions(text) > mentions(readFileSync(file, 'utf8')))
      throw new HttpError(
        422,
        'allowOutsideRoot and allowCustomProvider can only be switched on by editing the file yourself',
      );
    return;
  }
  const turned = newlyEnabled(before, after);
  if (turned.length)
    throw new HttpError(
      422,
      `${turned.join(', ')} can only be switched on by editing the file yourself, not from here`,
    );
}
