import { describe, expect, it } from 'vitest';
import { parseDeck } from '../lib/parse-deck.mjs';
import { insertSlide, moveSlide, removeSlide } from './deck-edit.mjs';

const deck = `---
title: T
---

# One

body

---
layout: center
---

# Two

<!-- note -->

---

# Three

\`\`\`md
---
inside a fence
\`\`\`
`;

async function slidesOf(text: string) {
  const parsed = await parseDeck('/x/slides.md', { '/x/slides.md': text });
  return parsed.slides.map((s: any) => ({
    title: s.title,
    source: s.source,
    content: s.content.trim(),
  }));
}
const titles = async (text: string) => (await slidesOf(text)).map((s: any) => s.title);

describe('removeSlide', () => {
  it('removes a slide with frontmatter and one with a plain separator', async () => {
    const slides = await slidesOf(deck);
    expect(
      await titles(
        removeSlide(
          deck,
          slides.map((s: any) => s.source),
          2,
        ),
      ),
    ).toEqual(['T', 'Three']);
    expect(
      await titles(
        removeSlide(
          deck,
          slides.map((s: any) => s.source),
          3,
        ),
      ),
    ).toEqual(['T', 'Two']);
  });
  it('keeps a code fence that contains ---', async () => {
    const slides = await slidesOf(deck);
    expect(
      removeSlide(
        deck,
        slides.map((s: any) => s.source),
        2,
      ),
    ).toContain('inside a fence');
  });
  it('refuses slide 1 and numbers out of range', async () => {
    const sources = (await slidesOf(deck)).map((s: any) => s.source);
    expect(() => removeSlide(deck, sources, 1)).toThrow('headmatter');
    expect(() => removeSlide(deck, sources, 9)).toThrow('from 1 to 3');
  });
});

describe('insertSlide', () => {
  it('puts a slide after another, also after the last one', async () => {
    const sources = (await slidesOf(deck)).map((s: any) => s.source);
    const middle = insertSlide(deck, sources, 1, '---\n\n# New');
    expect(await titles(middle)).toEqual(['T', 'New', 'Two', 'Three']);
    const end = insertSlide(deck, sources, 3, '---\nlayout: end\n---\n\n# Last');
    expect(await titles(end)).toEqual(['T', 'Two', 'Three', 'Last']);
    expect(end.endsWith('\n') && !end.endsWith('\n\n')).toBe(true);
  });
  it('wants a --- line first', async () => {
    const sources = (await slidesOf(deck)).map((s: any) => s.source);
    expect(() => insertSlide(deck, sources, 1, '# no separator')).toThrow('--- line');
  });
});

describe('moveSlide', () => {
  it('reorders slides and keeps their text', async () => {
    const before = await slidesOf(deck);
    const sources = before.map((s: any) => s.source);
    const moved = await slidesOf(moveSlide(deck, sources, 3, 2));
    expect(moved.map((s: any) => s.title)).toEqual(['T', 'Three', 'Two']);
    expect(moved[1].content).toBe(before[2].content);
    expect(moved[2].content).toBe(before[1].content);
  });
  it('refuses to move the first slide or in front of it', async () => {
    const sources = (await slidesOf(deck)).map((s: any) => s.source);
    expect(() => moveSlide(deck, sources, 1, 2)).toThrow('headmatter');
    expect(() => moveSlide(deck, sources, 2, 1)).toThrow('headmatter');
  });
  it('keeps the line endings of the file', async () => {
    const crlf = deck.replace(/\n/g, '\r\n');
    const sources = (await slidesOf(crlf)).map((s: any) => s.source);
    const out = moveSlide(crlf, sources, 3, 2);
    expect(out.includes('\r\n') && !/[^\r]\n/.test(out)).toBe(true);
  });
});
