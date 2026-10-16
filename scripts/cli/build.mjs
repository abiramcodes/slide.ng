// The `build` command: a static copy of the deck that any web server can host.
//   slide-ng build [slides.md] [--base /talk/] [--out dist] [--download] [--without-notes]
import { copyFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { ogImagePlan, placeOgImage } from '../build/og-image.mjs';
import { pwaEnabled, writePwa } from '../build/pwa.mjs';
import { exportSlides } from '../export/index.mjs';
import { downloadTarget } from '../export/filename.mjs';
import { resolveExportOptions } from '../export/options.mjs';
import { serveDirectory } from '../export/static-server.mjs';
import { parseDeck } from '../lib/parse-deck.mjs';
import { parseFlags } from './flags.mjs';
import { checkClaimable, publishDirectory } from './safe-dir.mjs';
import { buildDeck } from './runtime.mjs';

export const BUILD_FLAGS = {
  base: { type: 'string' },
  out: { type: 'string', alias: 'o' },
  download: { type: 'boolean' },
  'without-notes': { type: 'boolean' },
  'executable-path': { type: 'string' },
  timeout: { type: 'number' },
};

/** `/talk`, `talk/` and `/talk/` all become `/talk/`. Only plain path pieces are allowed (it goes into the page). */
export function normalizeBase(base = '/') {
  const path = `/${base}/`.replace(/\/+/g, '/');
  if (!/^\/([\w.~-]+\/)*$/.test(path) || path.includes('/../') || path.includes('/./')) {
    throw new Error(`--base must be a path such as /talk/, got "${base}"`);
  }
  return path;
}

export async function buildCommand(argv) {
  const { flags, positionals } = parseFlags(argv, BUILD_FLAGS);
  const entry = resolve(positionals[0] ?? 'slides.md');
  const root = dirname(entry);
  const base = normalizeBase(flags.base);
  const out = resolve(flags.out ?? 'dist');
  checkClaimable(out); // fail now, not after a long build
  const deck = await parseDeck(entry);
  const head = deck.headmatter;

  const download = flags.download || downloadTarget(head, entry) !== null;
  const workDir = join(root, '.slide-ng', 'build');
  const env = {
    SLIDE_NG_BUILD: '1', SLIDE_NG_BASE: base,
    SLIDE_NG_DOWNLOAD: flags.download ? '1' : '0', SLIDE_NG_WITHOUT_NOTES: flags['without-notes'] ? '1' : '0',
  };
  try {
    const dist = buildDeck({ entry, workDir, base, env });
    await afterBuild({ dist, deck, entry, root, base, workDir, download, flags });
    publishDirectory(dist, out);
    console.log(`\nBuilt ${deck.slides.length} slides into ${out} (base ${base}).`);
  } finally {
    rmSync(workDir, { recursive: true, force: true }); // the folder this command made itself
  }
}

// Files that can only be made once the app exists: the picture, the PDF, the 404 page, the offline worker.
async function afterBuild({ dist, deck, entry, root, base, workDir, download, flags }) {
  const head = deck.headmatter;
  const routerMode = head.routerMode === 'hash' ? 'hash' : 'history';
  const exportOptions = { 'executable-path': flags['executable-path'], timeout: flags.timeout };
  const needsBrowser = ogImagePlan(head, root).kind === 'auto' || download;
  const server = needsBrowser ? await serveDirectory(dist, base) : null;
  const served = server && { origin: server.origin, base };

  try {
    // Open Graph picture: the first slide.
    await placeOgImage(ogImagePlan(head, root), {
      deckRoot: root, distDir: dist, workDir: join(workDir, 'og'),
      makePicture: async (dir) => {
        const options = resolveExportOptions({ ...exportOptions, format: 'png', range: '1', scale: 1.5 }, {});
        await exportSlides({ deck, options, served, routerMode, outBase: join(dir, 'og'), log: () => {} });
        return join(dir, 'og', '001.png');
      },
    });
    // The PDF the "download" button points to.
    const target = downloadTarget(head, entry) ?? downloadTarget({ ...head, download: true }, entry);
    if (download && /^https?:|^\//.test(target)) console.log(`download points to ${target}; no PDF is made`);
    else if (download) {
      const options = resolveExportOptions(exportOptions, head);
      await exportSlides({ deck, options: { ...options, format: 'pdf' }, served, routerMode, outBase: join(dist, target.replace(/\.pdf$/, '')) });
    }
  } finally {
    await server?.close();
  }

  // GitHub Pages answers an unknown address with 404.html; Netlify reads _redirects. Both send it to the app.
  copyFileSync(join(dist, 'index.html'), join(dist, '404.html'));
  writeFileSync(join(dist, '_redirects'), `${base}*    ${base}index.html   200\n`);
  if (pwaEnabled(head)) console.log(`Offline support: ${writePwa(dist, head)} files for the service worker.`);
}
