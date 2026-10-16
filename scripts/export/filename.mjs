// Names of the files an export writes.
//
// `exportFilename` comes from the deck's headmatter, and a deck can be someone else's, so it is only ever
// used as a plain file name: no folders, no `..`, no odd characters. (Slidev's maintainers had to fix a
// path traversal here.) The `--output` flag is typed by the person running the command and may name a folder.
import { basename, extname, resolve, sep } from 'node:path';

const BAD = /[\\/:*?"<>|\0-\x1f]+/g; // folder separators, characters Windows refuses, control characters

/** A safe file name (without extension) from untrusted text, or `fallback` when nothing usable is left. */
export function safeName(text, fallback = 'slides-export') {
  const cleaned = String(text ?? '')
    .replace(BAD, '-')
    .replace(/\.{2,}/g, '-') // `..` can not survive
    .replace(/-{2,}/g, '-')
    .replace(/^[.\s-]+|[\s.-]+$/g, '') // no hidden files, no leading or trailing dashes and dots
    .slice(0, 100);
  return cleaned || fallback;
}

// Extensions we add ourselves; a name that already ends with one is not given a second one.
const KNOWN = ['.pdf', '.png', '.pptx', '.md'];

/**
 * Where an export goes. `output` is the --output flag (trusted, may be a path); otherwise the name comes from the
 * headmatter's `exportFilename` or the deck's file name, and always lands in `dir` (the current folder).
 * @param {{ output?: string, exportFilename?: string, entry?: string, dir?: string, suffix?: string }} options
 * `suffix` is added to a derived name (`-notes`). Returns the path without extension; the caller adds `.pdf` and so on.
 */
export function outputBase({ output, exportFilename, entry, dir = process.cwd(), suffix = '' }) {
  if (output) {
    const path = resolve(dir, output);
    return KNOWN.includes(extname(path).toLowerCase()) ? path.slice(0, -extname(path).length) : path;
  }
  // `suffix` marks a different kind of export (`-notes`). Without a headmatter name the deck's file name is used.
  const named = safeName(stripKnown(exportFilename ?? ''), '');
  const stem = named ? named + suffix : `${safeName(basename(entry ?? 'slides.md', '.md'), 'slides')}${suffix || '-export'}`;
  return resolve(dir, stem);
}

function stripKnown(name) {
  const ext = extname(name).toLowerCase();
  return KNOWN.includes(ext) ? name.slice(0, -ext.length) : name;
}

/** True when `file` is inside `dir` (after resolving `..`). Used before writing next to a base name. */
export function isInside(dir, file) {
  const d = resolve(dir) + sep;
  return resolve(file).startsWith(d);
}

/**
 * What the deck's `download` headmatter points to, or null. `download: true` is the PDF that `build --download` writes
 * (`<name>.pdf`); a string is a web address or a file in the build. Anything else (such as `javascript:`) is ignored.
 */
export function downloadTarget(headmatter, entry) {
  const d = headmatter.download;
  if (d === true || d === 'true' || d === 'auto') return `${basename(outputBase({ exportFilename: headmatter.exportFilename, entry, dir: '/' }))}.pdf`;
  if (typeof d === 'string' && /^(https?:\/\/|\/|[\w.-]+\.pdf$)/.test(d)) return d;
  return null;
}
