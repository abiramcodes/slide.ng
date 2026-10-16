// Reads the deck with Slidev's parser. Its `load` function follows `src:` imports
// (also with a `#2,4-6` slide range) and merges the importing slide's frontmatter
// over the imported one, so we get one flat list of slides.
import { dirname, resolve } from 'node:path';
import { injectPreparserExtensionLoader, load } from '@slidev/parser/fs';
import { mergeHeadmatter, resolveRoots } from './roots.mjs';
import { preparserExtensions } from './setup/node-setups.mjs';

// `sources` is optional: a { path: text } map that replaces reading files (used by tests).
// `options.theme` is the `--theme` flag. The result has `roots` (theme, addons, the deck's own folder) and a headmatter
// with the themes' defaults under it (see roots.mjs).
export async function parseDeck(file = 'slides.md', sources, options = {}) {
  const entry = resolve(file);
  // setup/preparser.ts of the roots: the parser asks for them once it has read the headmatter (which says which roots there are).
  injectPreparserExtensionLoader(async (_, headmatter, filepath, mode) => {
    const found = resolveRoots({ deckRoot: dirname(entry), headmatter, themeOverride: options.theme ?? (process.env.SLIDE_NG_THEME || undefined) });
    return preparserExtensions(found, { filepath, headmatter, mode });
  });
  const data = await load({ userRoot: dirname(entry), roots: [dirname(entry)] }, entry, sources);
  const problems = [];
  const roots = resolveRoots({ deckRoot: dirname(entry), headmatter: data.headmatter, themeOverride: options.theme ?? (process.env.SLIDE_NG_THEME || undefined), });
  const headmatter = mergeHeadmatter(roots, data.headmatter);
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
  for (const md of Object.values(data.markdownFiles)) for (const e of md.errors ?? []) problems.push(`${md.filepath}:${e.row}: ${e.message}`);
  return { headmatter, entry, roots, root: dirname(entry), slides, files: Object.keys(data.markdownFiles), problems };
}
