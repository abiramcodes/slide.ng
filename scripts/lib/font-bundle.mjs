// `fonts: { selfHost: true }` (headmatter): while building, download the web fonts of the deck and serve them from the
// build itself, so the deck does not need the font provider. An offline folder (`build --offline`) and a deck with
// `pwa: true` do this by default; `selfHost: false` turns it off.
//
// The provider's style sheet is fetched, every font file it names is downloaded into `folder`, and the sheet is written
// with those files as addresses. The bundler then copies them into the build like any other font in a style sheet.
// Safety (see safe-fetch.mjs): no address that is not public, at most 3 redirects, size limits, and only `@font-face` rules
// of the provider's sheet are kept (an `@import` or any other rule in it is dropped). A file must start like a font file.
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fontsUrl, resolveFonts } from './fonts.mjs';
import { emptyFolder } from './remote-assets.mjs';
import { safeFetch } from './safe-fetch.mjs';

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_SHEET = 1024 * 1024;
const TIMEOUT_MS = 20_000;
// Providers answer with the best format the browser says it understands; without a modern browser name they send big TrueType files.
const BROWSER =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const EXTENSIONS = {
  'font/woff2': '.woff2',
  'font/woff': '.woff',
  'font/ttf': '.ttf',
  'font/otf': '.otf',
  'application/font-woff2': '.woff2',
  'application/font-woff': '.woff',
  'application/x-font-ttf': '.ttf',
};

/** Should this build download the fonts? `building` is a production build, `offline` is `--offline`. */
export function wantsFontFiles(headmatter, { building, offline }) {
  const fonts = headmatter.fonts;
  if (!building || !fonts || typeof fonts !== 'object') return false;
  if (fonts.selfHost === false) return false;
  return (
    fonts.selfHost === true || offline || headmatter.pwa === true || headmatter.pwa === 'build'
  );
}

/** Every `url(...)` of a style sheet that is a web address, without duplicates. */
export function fontAddresses(css) {
  const found = new Set();
  for (const m of css.matchAll(/url\(\s*["']?(https?:\/\/[^)"'\s]+)["']?\s*\)/g)) found.add(m[1]);
  return [...found];
}

/** File name in the build for an address: a hash of the address plus the extension that fits the content type (or the address). */
export function fontFileName(url, contentType = '', sniffed = '') {
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 16);
  if (sniffed) return `${hash}${sniffed}`;
  const fromType = EXTENSIONS[contentType.split(';')[0].trim().toLowerCase()];
  const fromUrl = /\.(woff2|woff|ttf|otf)(?:[?#]|$)/i.exec(url)?.[1];
  return `${hash}${fromType ?? (fromUrl ? `.${fromUrl.toLowerCase()}` : '.woff2')}`;
}

/** What the first bytes say a font file is: its extension, or null. */
export function sniffFont(bytes) {
  const head = bytes.subarray(0, 4).toString('latin1');
  if (head === 'wOF2') return '.woff2';
  if (head === 'wOFF') return '.woff';
  if (head === 'OTTO') return '.otf';
  if (head === 'true' || head === '\x00\x01\x00\x00') return '.ttf';
  return null;
}

/** Only the `@font-face { ... }` rules of a style sheet (and nothing else: no @import, no other rule). */
export function onlyFontFaces(css) {
  return (
    (css.replace(/\/\*[\s\S]*?\*\//g, '').match(/@font-face\s*\{[^{}]*\}/g) ?? []).join('\n') + '\n'
  );
}

// The bytes at an address, or null with a warning.
async function download(
  url,
  warn,
  fetchImpl,
  { headers = {}, maxBytes = MAX_BYTES, allowLocal } = {},
) {
  try {
    const res = await safeFetch(url, {
      maxBytes,
      timeoutMs: TIMEOUT_MS,
      headers,
      fetchImpl,
      allowLocal,
    });
    if (!res.ok) return warn(`${url} answered ${res.status}`);
    return { bytes: res.bytes, type: res.headers.get('content-type') ?? '' };
  } catch (error) {
    return warn(`could not download ${url} (${error.message})`);
  }
}

/**
 * Downloads the deck's web fonts into `folder`. Returns the style sheet with local addresses (`./fonts/<file>`, relative to
 * `generated/theme.css`) and how many files were taken, or null when nothing could be done (a warning says why; the deck then keeps
 * loading its fonts from the provider). `folder` is emptied first.
 * @param {any} headmatter @param {string} folder @param {(m: string) => any} [warn]
 * @param {typeof fetch} [fetchImpl] a stand-in for tests @param {{ allowLocal?: boolean }} [options]
 */
export async function bundleFonts(
  headmatter,
  folder,
  warn = console.warn,
  fetchImpl,
  options = {},
) {
  emptyFolder(folder);
  const sheet = fontsUrl(resolveFonts(headmatter.fonts));
  if (!sheet) return null;
  const answer = await download(
    sheet,
    (m) => warn(`fonts: ${m}; the deck will load them from the provider`),
    fetchImpl,
    { headers: { 'user-agent': BROWSER }, maxBytes: MAX_SHEET, allowLocal: options.allowLocal },
  );
  if (!answer) return null;
  if (!/css/i.test(answer.type)) {
    warn(
      `fonts: ${sheet} did not answer with a style sheet; the deck will load them from the provider`,
    );
    return null;
  }
  const original = answer.bytes.toString('utf8');
  let css = onlyFontFaces(original);
  let taken = 0;
  for (const url of fontAddresses(css)) {
    const file = await download(url, (m) => warn(`fonts: ${m}, left as it is`), fetchImpl, {
      allowLocal: options.allowLocal,
    });
    if (!file) continue;
    const kind = sniffFont(file.bytes);
    if (!kind) {
      warn(`fonts: ${url} does not start like a font file, left as it is`);
      continue;
    }
    const name = fontFileName(url, file.type, kind);
    writeFileSync(join(folder, name), file.bytes);
    css = css.split(url).join(`./fonts/${name}`);
    taken++;
  }
  return taken ? { css, files: taken } : null;
}
