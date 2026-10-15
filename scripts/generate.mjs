// Reads slides.md and writes one Angular component per slide into
// src/slides/generated/, plus an index.ts. Usage: node scripts/generate.mjs [--watch]
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, watch, writeFileSync } from 'node:fs';
import { parseDeck } from './lib/parse-deck.mjs';
import { indexSource, slideName, slideSource } from './lib/emit.mjs';

const INPUT = 'slides.md';
const OUT = 'src/slides/generated/';

// Only write when the text changed, so the dev server does not rebuild for nothing.
function write(path, text) {
  if (existsSync(path) && readFileSync(path, 'utf8') === text) return;
  writeFileSync(path, text);
}

function generate() {
  const deck = parseDeck(readFileSync(INPUT, 'utf8'));
  mkdirSync(OUT, { recursive: true });
  const wanted = new Set(deck.slides.map((_, i) => `${slideName(i + 1)}.ts`).concat('index.ts', 'uno.css'));
  for (const f of readdirSync(OUT)) if (!wanted.has(f)) rmSync(OUT + f);
  deck.slides.forEach((s, i) => write(`${OUT}${slideName(i + 1)}.ts`, slideSource(s, i + 1)));
  write(`${OUT}index.ts`, indexSource(deck));
  console.log(`[slides] generated ${deck.slides.length} slides`);
}

generate();
if (process.argv.includes('--watch')) {
  let timer;
  // Editors save in bursts; wait a moment so we generate once.
  watch(INPUT, () => {
    clearTimeout(timer);
    timer = setTimeout(() => { try { generate(); } catch (e) { console.error(e.message); } }, 100);
  });
  console.log(`[slides] watching ${INPUT}`);
}
