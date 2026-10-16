import { describe, expect, it } from 'vitest';
import { canCheckTarget } from './download-check';

describe('canCheckTarget', () => {
  it('checks files of the build and paths on this site', () => {
    expect(canCheckTarget('deck.pdf')).toBe(true);
    expect(canCheckTarget('/files/deck.pdf')).toBe(true);
  });
  it('does not check addresses of other sites', () => {
    expect(canCheckTarget('https://x.test/deck.pdf')).toBe(false);
    expect(canCheckTarget('//x.test/deck.pdf')).toBe(false);
  });
});
