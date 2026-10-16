import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generatedIconSvg, ICONS, iconSource } from './pwa-icons.mjs';

const deck = (files: string[] = []) => {
  const dir = mkdtempSync(join(tmpdir(), 'slide-ng-icons-'));
  mkdirSync(join(dir, 'public'));
  for (const f of files) writeFileSync(join(dir, 'public', f), 'x');
  return dir;
};

describe('iconSource', () => {
  it('generates an icon when the deck has none', () =>
    expect(iconSource({}, deck()).kind).toBe('generated'));
  it('prefers public/icon.png over icon.svg', () => {
    expect(iconSource({}, deck(['icon.svg', 'icon.png']))).toMatchObject({
      kind: 'file',
      path: expect.stringMatching(/icon\.png$/),
    });
    expect(iconSource({}, deck(['icon.svg']))).toMatchObject({
      kind: 'file',
      path: expect.stringMatching(/icon\.svg$/),
    });
  });
  it('uses a local favicon of the public folder, with or without a slash', () => {
    const dir = deck(['logo.png']);
    expect(iconSource({ favicon: '/logo.png' }, dir).kind).toBe('file');
    expect(iconSource({ favicon: 'logo.png' }, dir).kind).toBe('file');
  });
  it('puts icon.png before the favicon', () => {
    expect(iconSource({ favicon: 'logo.png' }, deck(['logo.png', 'icon.png']))).toMatchObject({
      path: expect.stringMatching(/icon\.png$/),
    });
  });
  it('ignores a favicon that is an address, missing, an .ico or outside public/', () => {
    const dir = deck(['a.ico']);
    writeFileSync(join(dir, 'secret.png'), 'x');
    for (const favicon of [
      'https://x.test/a.png',
      'data:image/png;base64,AA',
      'missing.png',
      'a.ico',
      '../secret.png',
    ])
      expect(iconSource({ favicon }, dir).kind).toBe('generated');
  });
});

describe('generatedIconSvg', () => {
  it('shows the first letter of the title in capitals', () =>
    expect(generatedIconSvg('my talk')).toContain('>M</text>'));
  it('falls back to S and escapes markup', () => {
    expect(generatedIconSvg('')).toContain('>S</text>');
    expect(generatedIconSvg('<b>')).toContain('>&lt;</text>');
  });
});

describe('ICONS', () => {
  it('are 192, 512 and a maskable 512 with a border', () => {
    expect(ICONS.map((i) => [i.size, i.purpose])).toEqual([
      [192, 'any'],
      [512, 'any'],
      [512, 'maskable'],
    ]);
    expect(ICONS[2].pad).toBeGreaterThan(0);
  });
});
