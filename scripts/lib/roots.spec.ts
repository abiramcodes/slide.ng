import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findRootDir, mergeHeadmatter, readManifest, resolveRoots } from './roots.mjs';

const folder = () => mkdtempSync(join(tmpdir(), 'slide-ng-roots-'));
const dirIn = (base: string, ...parts: string[]) => { const d = join(base, ...parts); mkdirSync(d, { recursive: true }); return d; };

describe('findRootDir', () => {
  it('finds a folder by relative path', () => {
    const deck = folder();
    const theme = dirIn(deck, 'my-theme');
    expect(findRootDir('./my-theme', 'theme', deck)).toContain('my-theme');
    expect(theme).toBeTruthy();
  });
  it('finds packages named slide-ng-theme-<name> or <name>, also in a parent folder', () => {
    const base = folder();
    dirIn(base, 'node_modules', 'slide-ng-theme-ocean');
    dirIn(base, 'node_modules', 'plain-name');
    const deck = dirIn(base, 'talks', 'one');
    expect(findRootDir('ocean', 'theme', deck)).toContain('slide-ng-theme-ocean');
    expect(findRootDir('plain-name', 'addon', deck)).toContain('plain-name');
  });
  it('says what to do when nothing is found', () => {
    expect(() => findRootDir('nope', 'theme', folder())).toThrow('npm i -D slide-ng-theme-nope');
    expect(() => findRootDir('./nope', 'theme', folder())).toThrow('is not a folder');
    expect(() => findRootDir('', 'theme', folder())).toThrow('expected a name');
  });
});

describe('readManifest', () => {
  it('is empty without a theme.json', () => expect(readManifest(folder())).toEqual({ headmatter: {}, layouts: {} }));
  it('reads name, headmatter and layouts and drops bad entries', () => {
    const dir = folder();
    writeFileSync(join(dir, 'theme.json'), JSON.stringify({ name: 'x', headmatter: { colorSchema: 'dark' }, layouts: { hero: { props: ['image', 'bad name'], slots: ['right'], classProp: true }, odd: 5 } }));
    const m = readManifest(dir);
    expect(m.name).toBe('x');
    expect(m.headmatter).toEqual({ colorSchema: 'dark' });
    expect(m.layouts['hero']).toEqual({ props: ['image'], slots: ['right'], classProp: true });
    expect(m.layouts['odd']).toEqual({ props: [], slots: [], classProp: false });
  });
  it('refuses broken JSON with the file name', () => {
    const dir = folder();
    writeFileSync(join(dir, 'theme.json'), '{ nope');
    expect(() => readManifest(dir)).toThrow('theme.json is not valid JSON');
  });
});

describe('resolveRoots', () => {
  it('has only the deck without theme or addons, and treats default and none as no theme', () => {
    const deck = folder();
    expect(resolveRoots({ deckRoot: deck, headmatter: {} }).map((r) => r.id)).toEqual(['deck']);
    expect(resolveRoots({ deckRoot: deck, headmatter: { theme: 'default' } }).map((r) => r.id)).toEqual(['deck']);
    expect(resolveRoots({ deckRoot: deck, headmatter: { theme: 'none' } }).map((r) => r.id)).toEqual(['deck']);
  });
  it('orders theme, addons, deck', () => {
    const deck = folder();
    dirIn(deck, 't');
    dirIn(deck, 'a1');
    dirIn(deck, 'a2');
    const ids = resolveRoots({ deckRoot: deck, headmatter: { theme: './t', addons: ['./a1', './a2'] } }).map((r) => r.id);
    expect(ids).toEqual(['theme-t', 'addon-1-a1', 'addon-2-a2', 'deck']);
  });
  it('warns and uses the built-in theme for a package that is not installed, but fails for a missing path', () => {
    const deck = folder();
    const warnings: string[] = [];
    const roots = resolveRoots({ deckRoot: deck, headmatter: { theme: 'seriph' }, warn: (m: string) => warnings.push(m) });
    expect(roots.map((r) => r.id)).toEqual(['deck']);
    expect(warnings[0]).toContain('"seriph" was not found');
    expect(() => resolveRoots({ deckRoot: deck, headmatter: { theme: './nope' } })).toThrow('is not a folder');
  });
  it('lets --theme win over the headmatter', () => {
    const deck = folder();
    dirIn(deck, 'a');
    dirIn(deck, 'b');
    expect(resolveRoots({ deckRoot: deck, headmatter: { theme: './a' }, themeOverride: './b' })[0].id).toBe('theme-b');
  });
});

describe('mergeHeadmatter', () => {
  const root = (headmatter: object) => ({ manifest: { headmatter } });
  it('puts the deck over addons over the theme', () => {
    const merged = mergeHeadmatter([root({ colorSchema: 'dark', transition: 'fade' }), root({ transition: 'slide-left' })], { transition: 'none', title: 'T' });
    expect(merged).toEqual({ colorSchema: 'dark', transition: 'none', title: 'T' });
  });
  it('merges defaults key by key', () => {
    const merged = mergeHeadmatter([root({ defaults: { layout: 'center', class: 'a' } })], { defaults: { class: 'b' } });
    expect(merged.defaults).toEqual({ layout: 'center', class: 'b' });
  });
});
