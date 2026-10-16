import { describe, expect, it } from 'vitest';
import { cssString, fontsCss, fontsUrl, resolveFonts } from './fonts.mjs';
import { themeCss } from './theme-files.mjs';

describe('resolveFonts', () => {
  it('quotes the names and adds the fallbacks, like Slidev', () => {
    const f = resolveFonts({ sans: 'Robot', serif: 'Robot Slab', mono: 'Fira Code' });
    expect(f.sans.slice(0, 3)).toEqual(['"Robot"', 'ui-sans-serif', 'system-ui']);
    expect(f.serif).toEqual([
      '"Robot Slab"',
      'ui-serif',
      'Georgia',
      'Cambria',
      '"Times New Roman"',
      'Times',
      'serif',
    ]);
    expect(f.mono[0]).toBe('"Fira Code"');
    expect(f.webfonts).toEqual(['Robot', 'Robot Slab', 'Fira Code']);
    expect(f.weights).toEqual(['200', '400', '600']);
  });
  it('splits commas and keeps local fonts out of the web fonts', () => {
    const f = resolveFonts({ sans: 'Helvetica Neue,Robot', local: 'Helvetica Neue' });
    expect(f.sans.slice(0, 2)).toEqual(['"Helvetica Neue"', '"Robot"']);
    expect(f.webfonts).toEqual(['Robot']);
  });
  it('drops the fallbacks and web fonts with `fallbacks: false`', () => {
    const f = resolveFonts({ mono: 'Fira Code, monospace', fallbacks: false });
    expect(f.mono).toEqual(['"Fira Code"', '"monospace"']);
    expect(f.webfonts).toEqual([]);
  });
});

describe('fontsUrl', () => {
  it('asks Google for the weights, with + for spaces', () => {
    expect(fontsUrl(resolveFonts({ sans: 'Robot Slab' }))).toBe(
      'https://fonts.googleapis.com/css2?family=Robot+Slab:wght@200;400;600&display=swap',
    );
  });
  it('adds the italic axis', () => {
    expect(fontsUrl(resolveFonts({ sans: 'Robot', italic: true, weights: '400' }))).toContain(
      'family=Robot:ital,wght@0,400;1,400',
    );
  });
  it('uses coolLabs, or nothing for provider none', () => {
    expect(fontsUrl(resolveFonts({ sans: 'Robot', provider: 'coollabs' }))).toMatch(
      /^https:\/\/api\.fonts\.coollabs\.io\//,
    );
    expect(fontsUrl(resolveFonts({ sans: 'Robot', provider: 'none' }))).toBeNull();
  });
});

describe('fontsCss', () => {
  it('is empty when the deck sets no fonts', () => expect(fontsCss({})).toBe(''));
  it('sets the variables, the classes and the code font', () => {
    const css = fontsCss({ fonts: { mono: 'Fira Code', provider: 'none' } });
    expect(css).toContain('--slidev-font-mono: "Fira Code",ui-monospace');
    expect(css).toContain('--slidev-code-font-family: var(--slidev-font-mono)');
    expect(css).toContain(':root .font-serif');
    expect(css).not.toContain('@import');
  });
  it('puts the font import first in theme.css', () => {
    const css = themeCss([], { fonts: { sans: 'Robot' } });
    expect(css.startsWith('@import url("https://fonts.googleapis.com/css2?family=Robot')).toBe(
      true,
    );
  });
});

describe('fonts.provider', () => {
  const url = (fonts: object) => fontsUrl(resolveFonts({ sans: 'Robot', ...fonts }));
  it('takes the known providers by name or by address', () => {
    expect(url({})).toMatch(/^https:\/\/fonts\.googleapis\.com\/css2\?/);
    expect(url({ provider: 'https://fonts.googleapis.com/css2' })).toMatch(
      /^https:\/\/fonts\.googleapis\.com\//,
    );
    expect(url({ provider: 'https://api.fonts.coollabs.io/css2' })).toContain('coollabs');
  });
  it('refuses any other address unless the deck allows it, with a clear error', () => {
    for (const provider of [
      'https://evil.test/css2',
      'http://fonts.googleapis.com/css2',
      'http://127.0.0.1:8/css2',
    ])
      expect(() => url({ provider }), provider).toThrow('allowCustomProvider');
    expect(url({ provider: 'https://mirror.test/css2', allowCustomProvider: true })).toMatch(
      /^https:\/\/mirror\.test\/css2\?/,
    );
  });
  it('refuses an address with a user name', () => {
    expect(() => url({ provider: 'https://user:pw@fonts.googleapis.com/css2' })).toThrow(
      'user name',
    );
  });
  it('a provider that is not an address loads nothing', () => {
    expect(url({ provider: 'none' })).toBeNull();
    expect(url({ provider: 'x"); } body { background: url(//evil' })).toBeNull();
  });
  it('escapes the address in @import so it cannot close the string or the rule', () => {
    const css = fontsCss({
      fonts: {
        sans: 'Robot',
        provider: 'https://mirror.test/a")}*{background:url(//evil.test/x)}/*',
        allowCustomProvider: true,
      },
    });
    const line = css.split('\n').find((l) => l.startsWith('@import'))!;
    expect(line).toMatch(/^@import url\("[^"]*"\);$/);
    expect(line).not.toContain('")}');
  });
  it('cssString escapes quotes, backslashes and line breaks', () => {
    expect(cssString('a"b\\c\nd')).not.toMatch(/["\n]/);
  });
});
