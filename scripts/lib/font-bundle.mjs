// `fonts: { selfHost: true }` (headmatter): while building, download the web fonts of the deck and serve them from the
// build itself, so the deck does not need the font provider. An offline folder (`build --offline`) and a deck with
// `pwa: true` do this by default; `selfHost: false` turns it off.
//
// The provider's style sheet is fetched, every font file it names is downloaded into `folder`, and the sheet is written
// with those files as addresses. The bundler then copies them into the build like any other font in a style sheet.
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fontsUrl, resolveFonts } from './fonts.mjs';
import { emptyFolder } from './remote-assets.mjs';

const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 20_000;
// Providers answer with the best format the browser says it understands; without a modern browser name they send big TrueType files.
const BROWSER = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const EXTENSIONS = { 'font/woff2': '.woff2', 'font/woff': '.woff', 'font/ttf': '.ttf', 'font/otf': '.otf', 'application/font-woff2': '.woff2', 'application/font-woff': '.woff', 'application/x-font-ttf': '.ttf' };

/** Should this build download the fonts? `building` is a production build, `offline` is `--offline`. */
export function wantsFontFiles(headmatter, { building, offline }) {
  const fonts = headmatter.fonts;
  if (!building || !fonts || typeof fonts !== 'object') return false;
  if (fonts.selfHost === false) return false;
  return fonts.selfHost === true || offline || headmatter.pwa === true || headmatter.pwa === 'build';
}

/** Every `url(...)` of a style sheet that is a web address, without duplicates. */
export function fontAddresses(css) {
  const found = new Set();
  for (const m of css.matchAll(/url\(\s*["']?(https?:\/\/[^)"'\s]+)["']?\s*\)/g)) found.add(m[1]);
  return [...found];
}

/** File name in the build for an address: a hash of the address plus the extension that fits the content type (or the address). */
export function fontFileName(url, contentType = '') {
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 16);
  const fromType = EXTENSIONS[contentType.split(';')[0].trim().toLowerCase()];
  const fromUrl = /\.(woff2|woff|ttf|otf)(?:[?#]|$)/i.exec(url)?.[1];
  return `${hash}${fromType ?? (fromUrl ? `.${fromUrl.toLowerCase()}` : '.woff2')}`;
}

// The bytes at an address, or null with a warning.
async function download(url, warn, fetchImpl, headers = {}) {
  try {
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(TIMEOUT_MS), redirect: 'follow', headers });
    if (!res.ok) return warn(`${url} answered ${res.status}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > MAX_BYTES) return warn(`${url} is larger than 5 MB`);
    return { bytes, type: res.headers.get('content-type') ?? '' };
  } catch (error) {
    return warn(`could not download ${url} (${error.message})`);
  }
}

/**
 * Downloads the deck's web fonts into `folder`. Returns the style sheet with local addresses (`./fonts/<file>`, relative to
 * `generated/theme.css`) and how many files were taken, or null when nothing could be done (a warning says why; the deck then keeps
 * loading its fonts from the provider). `folder` is emptied first.
 */
export async function bundleFonts(headmatter, folder, warn = console.warn, fetchImpl = fetch) {
  emptyFolder(folder);
  const sheet = fontsUrl(resolveFonts(headmatter.fonts));
  if (!sheet) return null;
  const answer = await download(sheet, (m) => warn(`fonts: ${m}; the deck will load them from the provider`), fetchImpl, { 'user-agent': BROWSER });
  if (!answer) return null;
  let css = answer.bytes.toString('utf8');
  let taken = 0;
  for (const url of fontAddresses(css)) {
    const file = await download(url, (m) => warn(`fonts: ${m}, left as it is`), fetchImpl);
    if (!file) continue;
    const name = fontFileName(url, file.type);
    writeFileSync(join(folder, name), file.bytes);
    css = css.split(url).join(`./fonts/${name}`);
    taken++;
  }
  return taken ? { css, files: taken } : null;
}
