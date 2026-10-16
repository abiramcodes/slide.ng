// Saves a slide's drawing as `.slide-ng/drawings/<number>.svg` (only with `drawings: { persist: true }`).
// The file name is built here from a number that was checked; the page never supplies a name.
// The markup is checked too: only the shapes drauu draws, no scripts, no links.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DRAWINGS_DIR, svgDocument } from '../lib/drawings.mjs';
import { HttpError } from './http-error.mjs';

export const MAX_DRAWING = 500_000;
const SHAPES = new Set(['path', 'line', 'rect', 'ellipse', 'circle', 'polygon', 'polyline', 'g', 'defs', 'marker']);

/** True for markup made of drawing shapes only. */
export function isSafeMarkup(markup) {
  if (typeof markup !== 'string' || markup.length > MAX_DRAWING) return false;
  for (const tag of markup.matchAll(/<\/?\s*([^\s>/]*)/g)) if (!SHAPES.has(tag[1].toLowerCase())) return false; // also `<!--`, `<?`, `<script`
  if (/\son\w+\s*=/i.test(markup)) return false; // event handlers
  if (/javascript:|data:|href\s*=|<\s*!|&#|expression\s*\(|@import/i.test(markup)) return false;
  // url(#id) is how a marker is used; any other url() could load something.
  return !/url\(\s*(?!['"]?#)/i.test(markup);
}

/** Write (or, for an empty drawing, delete) the file of slide `no`. */
export function writeDrawing(ctx, no, markup, slideCount, size) {
  if (!Number.isInteger(no) || no < 1 || no > slideCount) throw new HttpError(400, 'bad slide number');
  const dir = join(ctx.root, DRAWINGS_DIR);
  const file = join(dir, `${no}.svg`);
  if (typeof markup === 'string' && markup.trim() === '') { rmSync(file, { force: true }); return; }
  if (!isSafeMarkup(markup)) throw new HttpError(422, 'the drawing contains something that is not a drawing shape');
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, svgDocument(markup, size));
}
