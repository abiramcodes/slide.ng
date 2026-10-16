import { describe, expect, it } from 'vitest';
import { setHeadmatterKey } from './frontmatter-edit.mjs';

describe('setHeadmatterKey', () => {
  it('replaces an existing key', () => {
    expect(setHeadmatterKey('---\ntitle: A\ntheme: default\n---\n\n# x\n', 'theme', './theme')).toBe('---\ntitle: A\ntheme: ./theme\n---\n\n# x\n');
  });
  it('adds a missing key right after the opening ---', () => {
    expect(setHeadmatterKey('---\ntitle: A\n---\n# x\n', 'theme', './theme')).toBe('---\ntheme: ./theme\ntitle: A\n---\n# x\n');
  });
  it('makes a block when there is none', () => {
    expect(setHeadmatterKey('# x\n', 'theme', './theme')).toBe('---\ntheme: ./theme\n---\n\n# x\n');
  });
  it('does not touch a key of the same name in a later slide', () => {
    const text = '---\ntitle: A\n---\n# x\n\n---\ntheme: other\n---\n# y\n';
    expect(setHeadmatterKey(text, 'theme', './t')).toContain('---\ntheme: other\n---');
  });
  it('keeps comments and refuses multi-line values', () => {
    expect(setHeadmatterKey('---\n# my comment\ntitle: A\n---\n', 'theme', './t')).toContain('# my comment');
    expect(() => setHeadmatterKey('# x', 'theme', 'a\nb')).toThrow();
  });
});
