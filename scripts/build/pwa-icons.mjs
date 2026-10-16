// The install icons of a deck with `pwa: true`: 192 and 512 pixel PNGs, plus a maskable 512 (the picture on a
// full-bleed background, so Android can crop it to any shape).
// Source, first match wins: public/icon.png, public/icon.svg, a local headmatter `favicon` (png, svg, jpg or webp,
// in public/), otherwise the slide.ng icons in default-icons/ (copied as they are, no browser needed).
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const BACKGROUND = '#16131A'; // behind a picture of your own in the maskable icon (the brand ink colour)
const DEFAULT_ICONS = join(dirname(fileURLToPath(import.meta.url)), 'default-icons');
const TYPES = {
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

/** The files written into the build and listed in the manifest. `pad` is the empty border of a maskable icon. */
export const ICONS = [
  { file: 'pwa-icon-192.png', size: 192, purpose: 'any', pad: 0 },
  { file: 'pwa-icon-512.png', size: 512, purpose: 'any', pad: 0 },
  { file: 'pwa-icon-maskable-512.png', size: 512, purpose: 'maskable', pad: 0.2 },
];

/** Where the picture comes from: `{ kind: 'file', path }` or `{ kind: 'default' }`. */
export function iconSource(headmatter, deckRoot) {
  const publicDir = resolve(deckRoot, 'public');
  const found = (name) => {
    const path = resolve(publicDir, name);
    return path.startsWith(publicDir + sep) &&
      extname(path).toLowerCase() in TYPES &&
      existsSync(path)
      ? { kind: 'file', path }
      : null;
  };
  const favicon =
    typeof headmatter.favicon === 'string' && !/^[a-z][a-z0-9+.-]*:|^\/\//i.test(headmatter.favicon)
      ? headmatter.favicon.replace(/^\/+/, '')
      : null;
  return (
    found('icon.png') ?? found('icon.svg') ?? (favicon && found(favicon)) ?? { kind: 'default' }
  );
}

/** Writes the slide.ng icons into `distDir`. */
export function copyDefaultIcons(distDir) {
  for (const { file } of ICONS) copyFileSync(join(DEFAULT_ICONS, file), join(distDir, file));
}

// The source as a data address an <img> can show.
function pictureAddress(source) {
  return `data:${TYPES[extname(source.path).toLowerCase()]};base64,${readFileSync(source.path).toString('base64')}`;
}

/**
 * Draws every icon with the browser and writes the PNGs into `distDir`. `browser` is a playwright Browser.
 * Only for a picture of your own (see iconSource); it gets the dark background in the maskable icon.
 */
export async function writeIcons(distDir, source, browser) {
  const address = pictureAddress(source);
  const page = await browser.newPage();
  try {
    for (const { file, size, pad } of ICONS) {
      const inner = Math.round(size * (1 - 2 * pad));
      await page.setViewportSize({ width: size, height: size });
      await page.setContent(
        `<body style="margin:0;display:grid;place-items:center;width:${size}px;height:${size}px;background:${pad ? BACKGROUND : 'transparent'}">` +
          `<img src="${address}" style="width:${inner}px;height:${inner}px;object-fit:contain"></body>`,
      );
      await page.waitForFunction(() => document.images[0].complete);
      writeFileSync(
        join(distDir, file),
        await page.screenshot({ type: 'png', omitBackground: true }),
      );
    }
  } finally {
    await page.close();
  }
}
