// The Open Graph image (the picture a chat or social site shows for a link to the deck).
//   seoMeta.ogImage: <address>   used as given
//   og-image.png in the deck's folder   copied into the build and used
//   seoMeta.ogImage: auto   (and no og-image.png) a screenshot of slide 1, made at build time
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const FILE = 'og-image.png';

/** What to do about the image: `{ kind: 'given' | 'file' | 'auto' | 'none' }`. */
export function ogImagePlan(headmatter, deckRoot) {
  const wanted = headmatter.seoMeta?.ogImage;
  if (typeof wanted === 'string' && wanted !== 'auto') return { kind: 'given' };
  if (existsSync(join(deckRoot, FILE))) return { kind: 'file' };
  return { kind: wanted === 'auto' ? 'auto' : 'none' };
}

/**
 * The address written into the page for a file of the build. Crawlers need a full address, so when `seoMeta.ogUrl`
 * (the deck's public address) is known it is used; otherwise the address starts at the base path.
 */
export function ogImageAddress(headmatter, base) {
  const site = headmatter.seoMeta?.ogUrl;
  if (typeof site === 'string' && /^https?:\/\//.test(site)) return new URL(FILE, site.endsWith('/') ? site : `${site}/`).href;
  return `${base}${FILE}`;
}

/** Puts og-image.png into the build: the deck's own file, or the picture `makePicture(file)` writes. */
export async function placeOgImage(plan, { deckRoot, distDir, workDir, makePicture }) {
  if (plan.kind === 'file') return copyFileSync(join(deckRoot, FILE), join(distDir, FILE));
  if (plan.kind !== 'auto') return;
  mkdirSync(workDir, { recursive: true });
  const picture = await makePicture(workDir);
  copyFileSync(picture, join(distDir, FILE));
}
