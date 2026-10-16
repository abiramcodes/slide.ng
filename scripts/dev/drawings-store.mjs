// Saves a slide's drawing as `.slide-ng/drawings/<number>.svg` (only with `drawings: { persist: true }`).
// The file name is built here from a number that was checked; the page never supplies a name.
// The markup is parsed too: only the shapes and attributes drauu writes are kept, no scripts, no links.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanDrawing } from '../lib/drawing-markup.mjs';
import { DRAWINGS_DIR, svgDocument } from '../lib/drawings.mjs';
import { HttpError } from './http-error.mjs';

export const MAX_DRAWING = 500_000;

/** True for markup made of drawing shapes only (see lib/drawing-markup.mjs, a strict parser). */
export const isSafeMarkup = (markup) => cleanDrawing(markup, MAX_DRAWING) !== null;

/** Write (or, for an empty drawing, delete) the file of slide `no`. */
export function writeDrawing(ctx, no, markup, slideCount, size) {
  if (!Number.isInteger(no) || no < 1 || no > slideCount)
    throw new HttpError(400, 'bad slide number');
  const dir = join(ctx.root, DRAWINGS_DIR);
  const file = join(dir, `${no}.svg`);
  if (typeof markup === 'string' && markup.trim() === '') {
    rmSync(file, { force: true });
    return;
  }
  // What is written is built again from the parsed shapes, not the text that arrived.
  const clean = cleanDrawing(markup, MAX_DRAWING);
  if (clean === null)
    throw new HttpError(422, 'the drawing contains something that is not a drawing shape');
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, svgDocument(clean, size));
}
