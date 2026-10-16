// Reads slides.md and writes one Angular component per slide into
// src/slides/generated/, plus an index.ts and uno.css (the CSS for the class names in use). Usage: node scripts/generate.mjs [--watch]
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, watch, writeFileSync } from 'node:fs';
import { parseDeck } from './lib/parse-deck.mjs';
import { slideName, slideSource } from './lib/emit.mjs';
import { indexSource } from './lib/index-source.mjs';
import { makeCss, tsFiles } from './lib/make-css.mjs';

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
  mkdirSync(OUT, { recursive: true });
  const wanted = new Set(deck.slides.map((_, i) => `${slideName(i + 1)}.ts`).concat('index.ts', 'uno.css'));
  for (const f of readdirSync(OUT)) if (!wanted.has(f)) rmSync(OUT + f);
  deck.slides.forEach((s, i) => write(`${OUT}${slideName(i + 1)}.ts`, slideSource(s, i + 1)));
  write(`${OUT}index.ts`, indexSource(deck));
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
