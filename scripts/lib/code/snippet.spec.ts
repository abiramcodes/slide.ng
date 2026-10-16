import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SNIPPET_LINE, dedent, findRegion, resolveSnippet } from './snippet.mjs';

const lines = [
  'a',
  '// #region one',
  '  x',
  '  // #region inner',
  '    y',
  '  // #endregion inner',
  '// #endregion one',
  'b',
];

describe('snippet lines', () => {
  it('splits file, region, language and the rest', () => {
    const m = SNIPPET_LINE.exec('<<< @/snippets/a.ts#part ts {2|3}{lines:true}')!;
    expect(m.slice(1)).toEqual(['@/snippets/a.ts', '#part', 'ts', '{2|3}{lines:true}']);
  });
  it('does not take the ranges for a language', () => {
    expect(SNIPPET_LINE.exec('<<< ./a.ts {*}{lines:true}')![3]).toBeUndefined();
  });
});

describe('regions', () => {
  it('finds the lines between the markers', () => {
    expect(findRegion(lines, 'one')).toEqual([
      '  x',
      '  // #region inner',
      '    y',
      '  // #endregion inner',
    ]);
  });
  it('finds an inner region', () => {
    expect(findRegion(lines, 'inner')).toEqual(['    y']);
  });
  it('returns null for an unknown region', () => {
    expect(findRegion(lines, 'nope')).toBeNull();
  });
  it('dedents by the smallest indent', () => {
    expect(dedent(['    a', '      b', ''])).toEqual(['a', '  b', '']);
  });
});

describe('resolveSnippet', () => {
  const root = mkdtempSync(join(tmpdir(), 'snip-'));
  writeFileSync(join(root, 'a.ts'), 'one\n// #region r\n  two\n// #endregion r\n');
  it('reads a file relative to the slide, language from the extension', () => {
    expect(resolveSnippet('<<< ./a.ts', join(root, 'slides.md'), '/elsewhere')).toMatchObject({
      code: 'one\n// #region r\n  two\n// #endregion r',
      lang: 'ts',
    });
  });
  it('reads `@/` from the project root and cuts a region', () => {
    expect(resolveSnippet('<<< @/a.ts#r js', '/elsewhere/slides.md', root)).toMatchObject({
      code: 'two',
      lang: 'js',
    });
  });
  it('throws a readable error for a missing file', () => {
    expect(() => resolveSnippet('<<< ./missing.ts', join(root, 'slides.md'), root)).toThrow(
      'Code snippet not found',
    );
  });
});
