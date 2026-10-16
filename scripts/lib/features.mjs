// Looks through the deck to see which heavy features it uses, before anything is generated.
// Slidev does the same (`detectFeatures`): a deck without math never pays for KaTeX.
import { SNIPPET_LINE } from './code/snippet.mjs';

// Code languages named on fences, in magic-move steps, and on `<<<` lines (by name or file extension).
export function detectLangs(text) {
  const langs = new Set();
  for (const m of text.matchAll(/^`{3,}\s*([\w#+-]+)/gm)) langs.add(m[1]);
  for (const line of text.split('\n')) {
    const m = SNIPPET_LINE.exec(line);
    if (!m) continue;
    const name = m[1];
    langs.add(m[3]?.trim() || name.split('.').pop());
  }
  return langs;
}

export function detectFeatures(slides) {
  const text = slides.map((s) => s.content).join('\n');
  return { langs: detectLangs(text) };
}
