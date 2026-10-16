// `slide-ng format [slides.md]`: tidies the markdown file with the same parser that reads it.
// What it does, slide by slide: trims blank lines around the content (one blank line after the frontmatter and before
// the next `---`), prints the frontmatter again as clean YAML (comments are kept), and puts the speaker note in an
// HTML comment at the end. Files that `src:` imports are not touched; give them as arguments to format them too.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse, prettify, stringify } from '@slidev/parser/fs';
import { parseFlags } from './flags.mjs';

/** The formatted text of a markdown deck. */
export async function formatMarkdown(text, filepath = 'slides.md') {
  const deck = prettify(await parse(text, filepath));
  return stringify(deck);
}

export async function formatCommand(argv) {
  const { positionals } = parseFlags(argv, {});
  const files = (positionals.length ? positionals : ['slides.md']).map((f) => resolve(f));
  for (const file of files) {
    const before = await readFile(file, 'utf8');
    const after = await formatMarkdown(before, file);
    if (after === before) {
      console.log(`${file}: already formatted`);
      continue;
    }
    await writeFile(file, after);
    console.log(`${file}: formatted`);
  }
}
