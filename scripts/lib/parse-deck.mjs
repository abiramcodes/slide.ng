// Splits slides.md into slides using Slidev's parser.
// We use the parser's pure `core` entry: it has no file access, so this
// function works the same in the generator and in unit tests.
import { parseSync } from '@slidev/parser/core';

export function parseDeck(markdown) {
  const parsed = parseSync(markdown, 'slides.md');
  const all = parsed.slides.map((s) => ({
    title: s.title,
    frontmatter: s.frontmatter,
    content: s.content,
    note: s.note,
  }));
  // Like Slidev: the frontmatter of the first slide is the deck's headmatter.
  const headmatter = all[0]?.frontmatter ?? {};
  // `hide` and `disabled` remove a slide completely.
  const slides = all.filter((s) => !s.frontmatter.hide && !s.frontmatter.disabled);
  return { headmatter, slides };
}
