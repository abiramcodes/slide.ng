import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  OutsideRootError,
  allowsOutsideRoot,
  assertReadable,
  insideRoots,
} from './outside-root.mjs';

const root = mkdtempSync(join(tmpdir(), 'outside-root-'));
const outside = mkdtempSync(join(tmpdir(), 'outside-other-'));
writeFileSync(join(root, 'in.md'), 'x');
writeFileSync(join(outside, 'secret.md'), 's');
mkdirSync(join(root, 'sub'));
symlinkSync(join(outside, 'secret.md'), join(root, 'link.md'));
symlinkSync(outside, join(root, 'dir-link'));

describe('insideRoots', () => {
  it('accepts files in the folder, also ones that do not exist yet', () => {
    expect(insideRoots(join(root, 'in.md'), [root])).toBe(true);
    expect(insideRoots(join(root, 'sub/new.md'), [root])).toBe(true);
  });
  it('refuses .. paths, other folders, symlinked files and symlinked folders', () => {
    expect(insideRoots(join(root, '../etc/passwd'), [root])).toBe(false);
    expect(insideRoots(join(outside, 'secret.md'), [root])).toBe(false);
    expect(insideRoots(join(root, 'link.md'), [root])).toBe(false);
    expect(insideRoots(join(root, 'dir-link/secret.md'), [root])).toBe(false);
  });
  it('accepts a theme folder next to the deck when it is listed', () => {
    expect(insideRoots(join(outside, 'secret.md'), [root, outside])).toBe(true);
  });
});

describe('assertReadable', () => {
  it('throws a clear error naming the opt-in, unless the deck allows it', () => {
    expect(() => assertReadable('/etc/passwd', 'The snippet', { roots: [root] })).toThrow(
      OutsideRootError,
    );
    expect(() => assertReadable('/etc/passwd', 'The snippet', { roots: [root] })).toThrow(
      'allowOutsideRoot: true',
    );
    expect(() =>
      assertReadable('/etc/passwd', 'The snippet', { roots: [root], allowOutsideRoot: true }),
    ).not.toThrow();
  });
  it('only a real true in the headmatter is an opt-in', () => {
    expect(allowsOutsideRoot({ allowOutsideRoot: true })).toBe(true);
    for (const v of ['true', 1, 'yes', undefined])
      expect(allowsOutsideRoot({ allowOutsideRoot: v })).toBe(false);
    expect(allowsOutsideRoot(undefined)).toBe(false);
  });
});
