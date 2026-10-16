import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseDeck } from './parse-deck.mjs';

// Parse a deck that lives only in memory (no src: imports).
const parse = (md: string) => parseDeck('/deck/slides.md', { '/deck/slides.md': md });

const deck = `---
title: My deck
theme: whatever
---

# One

---
layout: center
class: text-red-500
unknownKey: 42
---

# Two

Some text

<!-- speaker note -->

---

# Three
`;

describe('parseDeck', async () => {
  const { headmatter, slides } = await parse(deck);

  it('splits slides at --- separators', () => {
    expect(slides.length).toBe(3);
    expect(slides.map((s) => s.title)).toEqual(['My deck', 'Two', 'Three']);
  });
  it('treats the first frontmatter as headmatter', () => {
    expect(headmatter).toMatchObject({ title: 'My deck', theme: 'whatever' });
  });
  it('carries the frontmatter of each slide, unknown keys included', () => {
    expect(slides[1].frontmatter).toEqual({ layout: 'center', class: 'text-red-500', unknownKey: 42 });
    expect(slides[2].frontmatter).toEqual({});
  });
  it('takes the last HTML comment as the note and removes it from the content', () => {
    expect(slides[1].note).toBe('speaker note');
    expect(slides[1].content).not.toContain('speaker note');
  });
  it('reads a yaml block at the top of a slide as its frontmatter', async () => {
    const out = await parse('---\ntitle: T\n---\n\n# One\n\n---\n\n```yaml\nlayout: quote\n```\n\n# Two\n');
    expect(out.slides[1].frontmatter.layout).toBe('quote');
    expect(out.slides[1].content).not.toContain('layout: quote');
  });
  it('removes slides with hide or disabled', async () => {
    const result = await parse('# A\n\n---\nhide: true\n---\n\n# B\n\n---\ndisabled: true\n---\n\n# C\n\n---\n\n# D\n');
    expect(result.slides.map((s) => s.title)).toEqual(['A', 'D']);
  });
  it('does not split at --- inside a code fence', async () => {
    const result = await parse('# A\n\n```md\n---\nx\n---\n```\n\n---\n\n# B\n');
    expect(result.slides.length).toBe(2);
  });
});

describe('parseDeck: title, level and defaults', () => {
  it('gives the heading level of the title, or the `level` frontmatter', async () => {
    const { slides } = await parse('# A\n\n---\n\n## B\n\n---\nlevel: 3\n---\n\n## C\n');
    expect(slides.map((s) => s.level)).toEqual([1, 2, 3]);
  });
  it('takes the title from the frontmatter before the heading', async () => {
    const { slides } = await parse('# A\n\n---\ntitle: Named\n---\n\n# Heading\n');
    expect(slides[1].title).toBe('Named');
  });
  it('merges headmatter `defaults` under every slide, the slide wins', async () => {
    const { slides } = await parse('---\ndefaults:\n  layout: center\n  transition: fade\n---\n\n# A\n\n---\nlayout: quote\n---\n\n# B\n');
    expect(slides[0].frontmatter).toMatchObject({ layout: 'center', transition: 'fade' });
    expect(slides[1].frontmatter).toMatchObject({ layout: 'quote', transition: 'fade' });
  });
});

describe('parseDeck: src imports', () => {
  // A real folder, because the parser checks that imported files exist.
  const dir = mkdtempSync(join(tmpdir(), 'slideng-'));
  mkdirSync(join(dir, 'pages'));
  writeFileSync(join(dir, 'pages', 'extra.md'), '# Extra one\n\n---\nlayout: center\nclass: from-page\n---\n\n# Extra two\n\n---\n\n# Extra three\n');
  const main = (src: string) => {
    writeFileSync(join(dir, 'slides.md'), `# First\n\n---\nsrc: ${src}\nclass: from-main\n---\n\nignored text\n\n---\n\n# Last\n`);
    return parseDeck(join(dir, 'slides.md'));
  };

  it('replaces the slide by the slides of the imported file', async () => {
    const { slides, files } = await main('./pages/extra.md');
    expect(slides.map((s) => s.title)).toEqual(['First', 'Extra one', 'Extra two', 'Extra three', 'Last']);
    expect(files.length).toBe(2);
  });
  it('lets the importing slide win when frontmatter keys clash', async () => {
    const { slides } = await main('./pages/extra.md');
    expect(slides[2].frontmatter).toMatchObject({ layout: 'center', class: 'from-main' });
    expect((slides[2].frontmatter as Record<string, unknown>)['src']).toBeUndefined();
  });
  it('imports a range of slides after #', async () => {
    const { slides } = await main('./pages/extra.md#2-3');
    expect(slides.map((s) => s.title)).toEqual(['First', 'Extra two', 'Extra three', 'Last']);
  });
  it('reports a missing file as a problem and keeps going', async () => {
    const { slides, problems } = await main('./pages/nope.md');
    expect(slides.map((s) => s.title)).toEqual(['First', 'Last']);
    expect(problems.join()).toContain('not found');
  });
});
