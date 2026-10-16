// Reads slides.md and writes one Angular component per slide into
// src/slides/generated/, plus an index.ts and uno.css (the CSS for the class names in use). Usage: node scripts/generate.mjs [--watch]
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, watch, writeFileSync } from 'node:fs';
import { parseDeck } from './lib/parse-deck.mjs';
import { slideName, slideSource } from './lib/emit.mjs';
import { indexSource } from './lib/index-source.mjs';
import { layoutName } from './lib/layouts.mjs';
import { makeCss, tsFiles } from './lib/make-css.mjs';
import { detectFeatures } from './lib/features.mjs';
import { initHighlighter } from './lib/code/highlighter.mjs';
import { readDrawings } from './lib/drawings.mjs';
import { findLayers, layersSource } from './lib/layers.mjs';
import { monacoWriteTargets, resetMonacoWriteTargets } from './lib/code/monaco.mjs';
import { buildOptions, wantsRemoteAssets } from './lib/build-options.mjs';
import { headParts, renderIndexHtml } from './lib/head.mjs';
import { bundleRemoteAssets, emptyFolder } from './lib/remote-assets.mjs';
import { ogImageAddress, ogImagePlan } from './build/og-image.mjs';
import { pwaEnabled } from './build/pwa.mjs';

// SLIDES_FILE lets tests build another deck.
const INPUT = process.env.SLIDES_FILE ?? 'slides.md';
const OUT = 'src/slides/generated/';

// Only write when the text changed, so the dev server does not rebuild for nothing.
function write(path, text) {
  if (existsSync(path) && readFileSync(path, 'utf8') === text) return;
  writeFileSync(path, text);
}

// Stylesheets of the features that bring their own CSS, added to the app only when the deck uses them: KaTeX's CSS (and fonts),
// Magic Move's and Twoslash's CSS, and Monaco's CSS (it carries its icon font inside). Monaco's package maps `exports` to JavaScript only, so its CSS is reached by path.
function featureCss(features) {
  const imports = [];
  if (features.math) imports.push("@import 'katex/dist/katex.min.css';");
  if (features.magicMove) imports.push("@import '@shikijs/magic-move/style.css';");
  if (features.twoslash) imports.push("@import '@shikijs/twoslash/style-rich.css';");
  if (features.monaco) imports.push("@import '../../../node_modules/monaco-editor/min/vs/editor/editor.main.css';");
  return imports.length ? imports.join('\n') + '\n' : '/* no feature styles needed */\n';
}

// The editors that may save to a file (`{monaco-write}`). The dev server reads this list; see scripts/dev/monaco-write.mjs.
function writeMonacoTargets(root) {
  const targets = monacoWriteTargets();
  const file = `${root}/.slide-ng/monaco-files.json`;
  if (!Object.keys(targets).length && !existsSync(file)) return;
  mkdirSync(`${root}/.slide-ng`, { recursive: true });
  write(file, JSON.stringify(targets, null, 2) + '\n');
}

// The page itself (src/index.html is the template): title, description, social tags, favicon, manifest link.
function writeIndexHtml(deck, base) {
  const warn = (m) => console.warn(`[slides] ${m}`);
  const plan = ogImagePlan(deck.headmatter, deck.root);
  const ogImage = plan.kind === 'file' || plan.kind === 'auto' ? ogImageAddress(deck.headmatter, base) : null;
  const parts = headParts(deck.headmatter, { ogImage, pwa: pwaEnabled(deck.headmatter), warn });
  write(`${OUT}index.html`, renderIndexHtml(readFileSync('src/index.html', 'utf8'), parts, warn));
}

async function generate() {
  const deck = await parseDeck(INPUT);
  const build = buildOptions();
  deck.problems.forEach((p) => console.warn(`[slides] ${p}`));
  // Options of `slide-ng build` (see lib/build-options.mjs).
  if (build.download && deck.headmatter.download == null) deck.headmatter.download = true;
  if (build.withoutNotes) deck.slides.forEach((s) => { s.note = null; });
  mkdirSync(OUT, { recursive: true });
  // Remote pictures are fetched into the build only for a production build with `remoteAssets: true`.
  if (wantsRemoteAssets(deck.headmatter, build.building)) {
    const n = await bundleRemoteAssets(deck.slides, `${OUT}remote-assets`, (m) => console.warn(`[slides] ${m}`));
    console.log(`[slides] bundled ${n} remote images`);
  } else emptyFolder(`${OUT}remote-assets`);
  writeIndexHtml(deck, build.base);
  deck.drawings = readDrawings(deck.root, deck.headmatter);
  deck.layers = findLayers();
  // Decide each layout once, so that an unknown name is reported once.
  deck.slides.forEach((s, i) => (s.layout = layoutName(s.frontmatter, i)));
  const features = detectFeatures(deck.slides);
  await initHighlighter({ langs: features.langs, headmatter: deck.headmatter, twoslash: features.twoslash });
  const wanted = new Set(deck.slides.map((_, i) => `${slideName(i + 1)}.ts`).concat('index.ts', 'index.html', 'layers.ts', 'uno.css', 'features.css', 'remote-assets'));
  for (const f of readdirSync(OUT)) if (!wanted.has(f)) rmSync(OUT + f);
  resetMonacoWriteTargets();
  deck.slides.forEach((s, i) => write(`${OUT}${slideName(i + 1)}.ts`, slideSource(s, i + 1, deck)));
  writeMonacoTargets(deck.root);
  write(`${OUT}index.ts`, indexSource(deck));
  write(`${OUT}layers.ts`, layersSource(deck.layers));
  write(`${OUT}features.css`, featureCss(features));
  // The generated slides are scanned too: icon tags and alerts only become class names there.
  const slideFiles = deck.slides.map((_, i) => `${OUT}${slideName(i + 1)}.ts`);
  write(`${OUT}uno.css`, await makeCss([...deck.files, ...slideFiles, ...tsFiles('src/app')]));
  console.log(`[slides] generated ${deck.slides.length} slides`);
  return deck.files;
}

const files = await generate();
if (process.argv.includes('--watch')) {
  let timer;
  const watched = new Set();
  // Editors save in bursts; wait a moment so we generate once.
  const onChange = () => {
    clearTimeout(timer);
    timer = setTimeout(() => generate().then(watchAll).catch((e) => console.error(e.message)), 100);
  };
  // The entry file and every file it imports with `src:`.
  const watchAll = (list) => list.filter((f) => !watched.has(f)).forEach((f) => (watched.add(f), watch(f, onChange)));
  watchAll(files);
  watch('src/app', { recursive: true }, onChange); // layouts may use new class names
  console.log(`[slides] watching ${INPUT} (and its imports) and src/app`);
}
