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

// SLIDES_FILE lets tests build another deck.
const INPUT = process.env.SLIDES_FILE ?? 'slides.md';
const OUT = 'src/slides/generated/';

// Only write when the text changed, so the dev server does not rebuild for nothing.
function write(path, text) {
  if (existsSync(path) && readFileSync(path, 'utf8') === text) return;
  writeFileSync(path, text);
}

async function generate() {
  const deck = await parseDeck(INPUT);
  deck.problems.forEach((p) => console.warn(`[slides] ${p}`));
  // Decide each layout once, so that an unknown name is reported once.
  deck.slides.forEach((s, i) => (s.layout = layoutName(s.frontmatter, i)));
  const features = detectFeatures(deck.slides);
  await initHighlighter({ langs: features.langs, headmatter: deck.headmatter });
  mkdirSync(OUT, { recursive: true });
  const wanted = new Set(deck.slides.map((_, i) => `${slideName(i + 1)}.ts`).concat('index.ts', 'uno.css', 'features.css'));
  for (const f of readdirSync(OUT)) if (!wanted.has(f)) rmSync(OUT + f);
  deck.slides.forEach((s, i) => write(`${OUT}${slideName(i + 1)}.ts`, slideSource(s, i + 1, deck)));
  write(`${OUT}index.ts`, indexSource(deck));
  // KaTeX's stylesheet (and fonts) are only part of the app when the deck has math.
  write(`${OUT}features.css`, features.math ? "@import 'katex/dist/katex.min.css';\n" : '/* no feature styles needed */\n');
  write(`${OUT}uno.css`, await makeCss([...deck.files, ...tsFiles('src/app')]));
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
