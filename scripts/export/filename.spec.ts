import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { downloadTarget, isInside, outputBase, safeName } from './filename.mjs';

describe('safeName', () => {
  it('keeps a plain name', () => expect(safeName('My talk 2026')).toBe('My talk 2026'));
  it('removes folders and traversal', () => {
    expect(safeName('../../etc/passwd')).toBe('etc-passwd');
    expect(safeName('..\\..\\windows\\x')).toBe('windows-x');
    expect(safeName('/abs/olute')).toBe('abs-olute');
    expect(safeName('..')).toBe('slides-export');
    expect(safeName('a/../b')).toBe('a-b');
  });
  it('removes hidden-file dots, control characters and long names', () => {
    expect(safeName('.bashrc')).toBe('bashrc');
    expect(safeName('a\0b\nc')).toBe('a-b-c');
    expect(safeName('x'.repeat(500)).length).toBe(100);
  });
  it('falls back for empty or missing names', () => {
    expect(safeName('')).toBe('slides-export');
    expect(safeName(undefined, 'x')).toBe('x');
    expect(safeName('///')).toBe('slides-export');
  });
});

describe('outputBase', () => {
  const dir = '/work/deck';
  it('uses --output as given, without a known extension', () => {
    expect(outputBase({ output: 'out/talk.pdf', dir })).toBe(resolve(dir, 'out/talk'));
    expect(outputBase({ output: '/tmp/x', dir })).toBe('/tmp/x');
  });
  it('turns the headmatter name into a plain name in the folder', () => {
    expect(outputBase({ exportFilename: '../../evil', entry: 'slides.md', dir })).toBe(
      resolve(dir, 'evil'),
    );
    expect(outputBase({ exportFilename: 'talk.pdf', entry: 'slides.md', dir })).toBe(
      resolve(dir, 'talk'),
    );
    const base = outputBase({ exportFilename: '../../../../root/.ssh/x', entry: 'slides.md', dir });
    expect(isInside(dir, base)).toBe(true);
  });
  it('adds a suffix to derived names only', () => {
    expect(outputBase({ exportFilename: 'talk', entry: 'slides.md', dir, suffix: '-notes' })).toBe(
      resolve(dir, 'talk-notes'),
    );
    expect(outputBase({ entry: 'my.md', dir, suffix: '-notes' })).toBe(resolve(dir, 'my-notes'));
    expect(outputBase({ output: 'x', dir, suffix: '-notes' })).toBe(resolve(dir, 'x'));
  });
  it('falls back to the deck file name', () => {
    expect(outputBase({ entry: '/a/b/my-slides.md', dir })).toBe(resolve(dir, 'my-slides-export'));
  });
});

describe('isInside', () => {
  it('tells what is inside a folder', () => {
    expect(isInside('/a/b', '/a/b/c.png')).toBe(true);
    expect(isInside('/a/b', '/a/b/../c.png')).toBe(false);
    expect(isInside('/a/b', '/a/bc/c.png')).toBe(false);
  });
});

describe('downloadTarget', () => {
  it('turns true into the exported pdf name', () => {
    expect(downloadTarget({ download: true, exportFilename: 'talk' }, 'slides.md')).toBe(
      'talk.pdf',
    );
    expect(downloadTarget({ download: true }, '/a/slides.md')).toBe('slides-export.pdf');
    expect(downloadTarget({ download: true, exportFilename: '../../x' }, 'slides.md')).toBe(
      'x.pdf',
    );
  });
  it('keeps a web address or a pdf file name', () => {
    expect(downloadTarget({ download: 'https://example.com/a.pdf' }, 's.md')).toBe(
      'https://example.com/a.pdf',
    );
    expect(downloadTarget({ download: 'my.pdf' }, 's.md')).toBe('my.pdf');
  });
  it('ignores everything else, including script addresses', () => {
    expect(downloadTarget({ download: 'javascript:alert(1)' }, 's.md')).toBeNull();
    expect(downloadTarget({ download: false }, 's.md')).toBeNull();
    expect(downloadTarget({}, 's.md')).toBeNull();
  });
});
