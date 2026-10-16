import { describe, expect, it } from 'vitest';
import { documentTitle } from './page-title';

describe('documentTitle', () => {
  it('joins the slide and the deck title without a template', () => {
    expect(documentTitle('Intro', { title: 'Talk' })).toBe('Intro - Talk');
    expect(documentTitle('Talk', { title: 'Talk' })).toBe('Talk');
    expect(documentTitle(null, { title: 'Talk' })).toBe('Talk');
    expect(documentTitle(null, {})).toBe('slide.ng');
  });
  it('uses titleTemplate with the slide title, or the deck title', () => {
    expect(documentTitle('Intro', { title: 'Talk', titleTemplate: '%s | me' })).toBe('Intro | me');
    expect(documentTitle(null, { title: 'Talk', titleTemplate: '%s | me' })).toBe('Talk | me');
    expect(documentTitle('A', { titleTemplate: 'x %s %s' })).toBe('x A A');
  });
});
