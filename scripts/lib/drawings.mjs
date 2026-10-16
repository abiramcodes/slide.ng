// Drawings saved as SVG files: `.slide-ng/drawings/<slide number>.svg` next to the deck.
// The dev server writes them (when the deck has `drawings: { persist: true }`), the generator reads them
// back so a build shows them, and both use the two small functions below to move between a file and the markup drauu makes.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { canvasSize } from './canvas-size.mjs';

export const DRAWINGS_DIR = '.slide-ng/drawings';

/** The file text for the markup of one drawing: a whole SVG image, so the file opens in any viewer. */
export const svgDocument = (markup, { width, height } = canvasSize()) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${markup}</svg>\n`;

/** The markup inside a file's <svg>...</svg>; '' when the text is not an SVG. */
export function svgInner(text) {
  const open = /^\s*(?:<\?xml[^>]*>\s*)?<svg\b[^>]*>/.exec(text);
  const end = text.lastIndexOf('</svg>');
  return open && end > open[0].length ? text.slice(open[0].length, end) : '';
}

/** Slide number -> markup, for every `<n>.svg` in the folder (nothing unless the deck persists drawings). */
export function readDrawings(root, headmatter) {
  const dir = join(root, DRAWINGS_DIR);
  if (!headmatter?.drawings?.persist || !existsSync(dir)) return {};
  const out = {};
  for (const name of readdirSync(dir)) {
    const m = /^(\d+)\.svg$/.exec(name);
    const markup = m && svgInner(readFileSync(join(dir, name), 'utf8'));
    if (markup) out[Number(m[1])] = markup;
  }
  return out;
}
