// `remoteAssets: true` (headmatter): while building, download the remote images a deck uses and serve them from the
// build itself, so the deck works offline and does not depend on someone else's server.
//
// Only images are taken: the answer must have an `image/*` content type and be at most 20 MB. The address list
// comes from the deck's own text (markdown images, <img src>, CSS url(), and the frontmatter keys that name an image).
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MAX_BYTES = 20 * 1024 * 1024;
const TIMEOUT_MS = 20_000;
const FOLDER = 'remote-assets'; // the folder inside the build the pictures end up in

// Where an address can stand and still be an image.
const PATTERNS = [
  /!\[[^\]]*\]\(\s*<?(https?:\/\/[^)\s>]+)/g, //          ![alt](https://...)
  /<img\b[^>]*?\ssrc=["'](https?:\/\/[^"']+)["']/gi, //   <img src="https://...">
  /\burl\(\s*["']?(https?:\/\/[^)"']+)["']?\s*\)/g, //    background: url(https://...)
  /^\s*(?:image|background|backgroundImage|poster):\s*["']?(https?:\/\/[^\s"']+)/gm, // frontmatter: image: https://...
];

/** Every remote image address in a piece of text, without duplicates. */
export function findRemoteImages(text) {
  const found = new Set();
  for (const pattern of PATTERNS) for (const match of text.matchAll(pattern)) found.add(match[1]);
  return [...found];
}

const EXTENSIONS = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
  'image/x-icon': '.ico',
};

/** File name in the build for an address: a hash of the address plus the extension that fits the content type. */
export function localName(url, contentType) {
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 16);
  return `${hash}${EXTENSIONS[contentType.split(';')[0].trim().toLowerCase()] ?? '.img'}`;
}

/** Downloads one picture. Returns `{ name, bytes }`, or null when it is not an image (a warning is given). */
export async function downloadImage(url, warn, fetchImpl = fetch) {
  try {
    const res = await fetchImpl(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: 'follow',
    });
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !type.toLowerCase().startsWith('image/'))
      return warn(`${url} is not an image (status ${res.status}, type "${type}"), left as it is`);
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > MAX_BYTES) return warn(`${url} is larger than 20 MB, left as it is`);
    return { name: localName(url, type), bytes };
  } catch (error) {
    return warn(`could not download ${url} (${error.message}), left as it is`);
  }
}

/** Replaces each downloaded address in `text` by its new relative address (relative to the page's <base>). */
export function rewriteAddresses(text, mapping) {
  let result = text;
  // Longest first, so an address that starts like another one is not cut.
  for (const url of Object.keys(mapping).sort((a, b) => b.length - a.length))
    result = result.split(url).join(mapping[url]);
  return result;
}

/** Makes sure `folder` exists and holds nothing (it only ever holds what a previous run wrote). */
export function emptyFolder(folder) {
  mkdirSync(folder, { recursive: true });
  for (const f of readdirSync(folder)) rmSync(join(folder, f), { recursive: true });
}

/**
 * Downloads the images of all slides into `folder` and rewrites the slides' text and frontmatter.
 * Returns how many were bundled. `folder` is emptied first.
 */
export async function bundleRemoteAssets(slides, folder, warn = console.warn, fetchImpl = fetch) {
  const texts = slides.map(
    (s) => `${s.content}\n${JSON.stringify(s.frontmatter).replace(/\\"/g, '"')}`,
  );
  const urls = [...new Set(texts.flatMap(findRemoteImages))];
  emptyFolder(folder);
  if (!urls.length) return 0;

  const mapping = {};
  for (const url of urls) {
    const image = await downloadImage(url, warn, fetchImpl);
    if (!image) continue;
    writeFileSync(join(folder, image.name), image.bytes);
    mapping[url] = `${FOLDER}/${image.name}`;
  }
  for (const slide of slides) {
    slide.content = rewriteAddresses(slide.content, mapping);
    slide.frontmatter = JSON.parse(rewriteAddresses(JSON.stringify(slide.frontmatter), mapping));
    slide.note = slide.note && rewriteAddresses(slide.note, mapping);
  }
  return Object.keys(mapping).length;
}
