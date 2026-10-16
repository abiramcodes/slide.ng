// Reads the deck with Slidev's parser. Its `load` function follows `src:` imports
// (also with a `#2,4-6` slide range) and merges the importing slide's frontmatter
// over the imported one, so we get one flat list of slides.
import { dirname, resolve } from 'node:path';
import { load } from '@slidev/parser/fs';

// `sources` is optional: a { path: text } map that replaces reading files (used by tests).
export async function parseDeck(file = 'slides.md', sources) {
  const entry = resolve(file);
  const data = await load({ userRoot: dirname(entry), roots: [dirname(entry)] }, entry, sources);
  const headmatter = data.headmatter;
  // `defaults:` in the headmatter is the starting point of every slide's frontmatter.
  const defaults = headmatter.defaults ?? {};

  const slides = data.slides.map((s) => ({
    title: s.title,
    level: s.level,
    frontmatter: { ...defaults, ...s.frontmatter },
    content: s.content,
    note: s.note,
    file: s.source?.filepath, // the markdown file this slide came from (snippet paths start there)
    // Where the slide sits in that file, in lines: the dev server edits the file there.
    source: s.source && { filepath: s.source.filepath, start: s.source.start, contentStart: s.source.contentStart, end: s.source.end },
  }));

  // Import problems (missing file, circular import, bad range) are collected by the parser.
  const problems = Object.values(data.markdownFiles).flatMap((md) =>
    (md.errors ?? []).map((e) => `${md.filepath}:${e.row}: ${e.message}`),
  );
  return { headmatter, entry, root: dirname(entry), slides, files: Object.keys(data.markdownFiles), problems };
}
