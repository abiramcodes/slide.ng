// The install icons of a deck with `pwa: true`: 192 and 512 pixel PNGs, plus a maskable 512 (the picture on a
// full-bleed background, so Android can crop it to any shape).
// Source, first match wins: public/icon.png, public/icon.svg, a local headmatter `favicon` (png, svg, jpg or webp,
// in public/), otherwise a generated picture: dark square with the first letter of the title.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';

const BACKGROUND = '#121212';
const TYPES = { '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

/** The files written into the build and listed in the manifest. `pad` is the empty border of a maskable icon. */
export const ICONS = [
  { file: 'pwa-icon-192.png', size: 192, purpose: 'any', pad: 0 },
  { file: 'pwa-icon-512.png', size: 512, purpose: 'any', pad: 0 },
  { file: 'pwa-icon-maskable-512.png', size: 512, purpose: 'maskable', pad: 0.2 },
];

/** Where the picture comes from: `{ kind: 'file', path }` or `{ kind: 'generated' }`. */
export function iconSource(headmatter, deckRoot) {
  const publicDir = resolve(deckRoot, 'public');
  const found = (name) => {
    const path = resolve(publicDir, name);
    return path.startsWith(publicDir + sep) && extname(path).toLowerCase() in TYPES && existsSync(path) ? { kind: 'file', path } : null;
  };
  const favicon = typeof headmatter.favicon === 'string' && !/^[a-z][a-z0-9+.-]*:|^\/\//i.test(headmatter.favicon) ? headmatter.favicon.replace(/^\/+/, '') : null;
  return found('icon.png') ?? found('icon.svg') ?? (favicon && found(favicon)) ?? { kind: 'generated' };
}

/** The generated picture: the first letter of the title, white on the dark background. */
export function generatedIconSvg(title) {
  const letter = (Array.from(String(title ?? '').trim())[0] ?? 'S').toUpperCase();
  const safe = letter.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BACKGROUND}"/>` +
    `<text x="256" y="256" fill="#fff" font-family="sans-serif" font-weight="700" font-size="300" text-anchor="middle" dominant-baseline="central">${safe}</text></svg>`;
}

// The source as a data address an <img> can show.
function pictureAddress(source, headmatter) {
  if (source.kind === 'generated') return `data:image/svg+xml;base64,${Buffer.from(generatedIconSvg(headmatter.title)).toString('base64')}`;
  return `data:${TYPES[extname(source.path).toLowerCase()]};base64,${readFileSync(source.path).toString('base64')}`;
}

/**
 * Draws every icon with the browser and writes the PNGs into `distDir`. `browser` is a playwright Browser.
 * A picture of your own gets the dark background only in the maskable icon; a generated one is full-bleed already.
 */
export async function writeIcons(distDir, headmatter, deckRoot, browser) {
  const source = iconSource(headmatter, deckRoot);
  const address = pictureAddress(source, headmatter);
  const page = await browser.newPage();
  try {
    for (const { file, size, pad } of ICONS) {
      const border = source.kind === 'generated' ? 0 : pad;
      const inner = Math.round(size * (1 - 2 * border));
      await page.setViewportSize({ width: size, height: size });
      await page.setContent(
        `<body style="margin:0;display:grid;place-items:center;width:${size}px;height:${size}px;background:${border ? BACKGROUND : 'transparent'}">` +
        `<img src="${address}" style="width:${inner}px;height:${inner}px;object-fit:contain"></body>`,
      );
      await page.waitForFunction(() => document.images[0].complete);
      writeFileSync(join(distDir, file), await page.screenshot({ type: 'png', omitBackground: true }));
    }
  } finally {
    await page.close();
  }
  return source;
}
