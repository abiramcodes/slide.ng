import { parseDeck } from './parse-deck.mjs';

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

describe('parseDeck', () => {
  const { headmatter, slides } = parseDeck(deck);

  it('splits slides at --- separators', () => {
    expect(slides.length).toBe(3);
    expect(slides.map((s) => s.title)).toEqual(['My deck', 'Two', 'Three']);
  });
  it('treats the first frontmatter as headmatter', () => {
    expect(headmatter).toEqual({ title: 'My deck', theme: 'whatever' });
  });
  it('carries the frontmatter of each slide, unknown keys included', () => {
    expect(slides[1].frontmatter).toEqual({ layout: 'center', class: 'text-red-500', unknownKey: 42 });
    expect(slides[2].frontmatter).toEqual({});
  });
  it('takes the last HTML comment as the note and removes it from the content', () => {
    expect(slides[1].note).toBe('speaker note');
    expect(slides[1].content).not.toContain('speaker note');
  });
  it('removes slides with hide or disabled', () => {
    const result = parseDeck('# A\n\n---\nhide: true\n---\n\n# B\n\n---\ndisabled: true\n---\n\n# C\n\n---\n\n# D\n');
    expect(result.slides.map((s) => s.title)).toEqual(['A', 'D']);
  });
  it('does not split at --- inside a code fence', () => {
    const result = parseDeck('# A\n\n```md\n---\nx\n---\n```\n\n---\n\n# B\n');
    expect(result.slides.length).toBe(2);
  });
});
