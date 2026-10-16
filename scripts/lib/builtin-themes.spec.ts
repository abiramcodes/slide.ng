import { existsSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RootNotFoundError, findRootDir, mergeHeadmatter, readManifest, resolveRoots } from './roots.mjs';

// Theme names that ship with slide.ng (themes/<name>/) are found before node_modules.
const folder = () => mkdtempSync(join(tmpdir(), 'slide-ng-builtin-'));
const dirIn = (base: string, ...parts: string[]) => { const d = join(base, ...parts); mkdirSync(d, { recursive: true }); return d; };
const themesDir = () => { const d = folder(); ['seriph', 'bricks'].forEach((n) => dirIn(d, n)); return d; };

describe('built-in theme names', () => {
  it('finds a theme name in the built-in themes folder', () => {
    const roots = resolveRoots({ deckRoot: folder(), headmatter: { theme: 'seriph' }, builtinDir: themesDir() });
    expect(roots.map((r) => r.id)).toEqual(['theme-seriph', 'deck']);
    expect(roots[0].dir).toContain('seriph');
  });
  it('looks in the built-in folder before node_modules', () => {
    const base = folder();
    dirIn(base, 'node_modules', 'slide-ng-theme-seriph');
    const deck = dirIn(base, 'deck');
    expect(findRootDir('seriph', 'theme', deck, themesDir())).not.toContain('node_modules');
    // the full package name is still the way to use an installed copy
    expect(findRootDir('slide-ng-theme-seriph', 'theme', deck, themesDir())).toContain('node_modules');
  });
  it('is only for theme names, not addons, paths or scoped names', () => {
    const builtin = themesDir();
    expect(() => findRootDir('seriph', 'addon', folder(), builtin)).toThrow(RootNotFoundError);
    expect(() => findRootDir('./seriph', 'theme', folder(), builtin)).toThrow('is not a folder');
    expect(() => findRootDir('@x/seriph', 'theme', folder(), builtin)).toThrow(RootNotFoundError);
  });
  it('keeps default as the built-in look, with no root, even if a folder of that name exists', () => {
    const builtin = themesDir();
    dirIn(builtin, 'default');
    expect(resolveRoots({ deckRoot: folder(), headmatter: { theme: 'default' }, builtinDir: builtin }).map((r) => r.id)).toEqual(['deck']);
  });
  it('falls back to node_modules for a name that is not built in', () => {
    const base = folder();
    dirIn(base, 'node_modules', 'slide-ng-theme-ocean');
    expect(findRootDir('ocean', 'theme', base, themesDir())).toContain('slide-ng-theme-ocean');
  });
});

describe('the official themes of this repository', () => {
  const real = resolve('themes');
  const names = ['seriph', 'shibainu', 'bricks', 'apple-basic'];
  const head = (name: string) => readManifest(join(real, name)).headmatter as any;

  it('are folders with a theme.json and a README that resolve by name', () => {
    for (const name of names) {
      expect(existsSync(join(real, name, 'theme.json')), name).toBe(true);
      expect(existsSync(join(real, name, 'README.md')), name).toBe(true);
      expect(resolveRoots({ deckRoot: folder(), headmatter: { theme: name }, builtinDir: real })[0].id).toBe(`theme-${name}`);
    }
  });
  it('leave default to the built-in look', () => {
    expect(resolveRoots({ deckRoot: folder(), headmatter: { theme: 'default' }, builtinDir: real }).map((r) => r.id)).toEqual(['deck']);
  });
  it('carry the fonts and colour schema of the Slidev packages', () => {
    expect(head('seriph').fonts).toMatchObject({ sans: 'PT Serif', serif: 'PT Serif', mono: 'PT Mono', italic: true });
    expect(head('shibainu')).toMatchObject({ colorSchema: 'dark', fonts: { sans: 'Titillium Web', mono: 'Fira Code' } });
    expect(head('bricks')).toMatchObject({ colorSchema: 'light', fonts: { sans: 'Signika Negative', serif: 'Sigmar One', mono: 'Fira Code' } });
    expect(head('apple-basic').fonts).toMatchObject({ sans: 'Helvetica Neue', local: 'Helvetica Neue' });
  });
});

describe('theme fonts and the deck', () => {
  const root = (headmatter: object) => ({ manifest: { headmatter } });
  it('merges the fonts of a theme with the deck key by key, as Slidev does', () => {
    const merged = mergeHeadmatter([root({ fonts: { sans: 'PT Serif', mono: 'PT Mono' } })], { fonts: { mono: 'Fira Code' } });
    expect(merged.fonts).toEqual({ sans: 'PT Serif', mono: 'Fira Code' });
  });
});
