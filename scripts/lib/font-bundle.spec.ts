import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  bundleFonts,
  fontAddresses,
  fontFileName,
  onlyFontFaces,
  sniffFont,
  wantsFontFiles,
} from './font-bundle.mjs';
import { fontsCss, fontsUrl, resolveFonts } from './fonts.mjs';
import { themeCss } from './theme-files.mjs';

const CSS = `/* latin */
@font-face { font-family: 'Robot'; font-weight: 400; src: url(https://fonts.test/a/robot-latin.woff2) format('woff2'); }
/* latin-ext */
@font-face { font-family: 'Robot'; font-weight: 400; src: url("https://fonts.test/a/robot-ext.woff2") format('woff2'); }
@font-face { font-family: 'Robot'; font-weight: 600; src: url(https://fonts.test/a/robot-latin.woff2) format('woff2'); }
`;

// A fetch that answers from a table and records what was asked.
function fakeFetch(
  table: Record<string, { type: string; body: string | Buffer; status?: number }>,
) {
  const asked: { url: string; headers: Record<string, string> }[] = [];
  const impl = async (url: string, init: { headers?: Record<string, string> } = {}) => {
    asked.push({ url, headers: init.headers ?? {} });
    const hit = table[url];
    if (!hit) return new Response('no', { status: 404 });
    return new Response(typeof hit.body === 'string' ? hit.body : new Uint8Array(hit.body), {
      status: hit.status ?? 200,
      headers: { 'content-type': hit.type },
    });
  };
  return { impl: impl as unknown as typeof fetch, asked };
}

describe('wantsFontFiles', () => {
  const fonts = { sans: 'Robot' };
  it('needs a production build and a fonts object', () => {
    expect(
      wantsFontFiles({ fonts: { ...fonts, selfHost: true } }, { building: false, offline: true }),
    ).toBe(false);
    expect(wantsFontFiles({}, { building: true, offline: true })).toBe(false);
  });
  it('is on for an offline folder and for pwa, off for a plain build', () => {
    expect(wantsFontFiles({ fonts }, { building: true, offline: true })).toBe(true);
    expect(wantsFontFiles({ fonts, pwa: true }, { building: true, offline: false })).toBe(true);
    expect(wantsFontFiles({ fonts }, { building: true, offline: false })).toBe(false);
  });
  it('can be asked for, or switched off', () => {
    expect(
      wantsFontFiles({ fonts: { ...fonts, selfHost: true } }, { building: true, offline: false }),
    ).toBe(true);
    expect(
      wantsFontFiles(
        { fonts: { ...fonts, selfHost: false }, pwa: true },
        { building: true, offline: true },
      ),
    ).toBe(false);
  });
});

describe('fontAddresses and fontFileName', () => {
  it('lists each web address once, quoted or not', () => {
    expect(fontAddresses(CSS)).toEqual([
      'https://fonts.test/a/robot-latin.woff2',
      'https://fonts.test/a/robot-ext.woff2',
    ]);
  });
  it('ignores addresses that are not on the web', () => {
    expect(fontAddresses('src: url(data:font/woff2;base64,AAAA), url(./local.woff2)')).toEqual([]);
  });
  it('names the file by hash and by content type, then by the address', () => {
    expect(fontFileName('https://x.test/a', 'font/woff2')).toMatch(/^[0-9a-f]{16}\.woff2$/);
    expect(fontFileName('https://x.test/a.ttf?v=1', 'application/octet-stream')).toMatch(/\.ttf$/);
    expect(fontFileName('https://x.test/a', 'font/woff2')).not.toBe(
      fontFileName('https://x.test/b', 'font/woff2'),
    );
  });
});

describe('bundleFonts', () => {
  const head = {
    fonts: {
      sans: 'Robot',
      weights: '400,600',
      provider: 'https://fonts.test/css2',
      allowCustomProvider: true,
    },
  };
  const sheet = fontsUrl(resolveFonts(head.fonts))!;
  const ok = { type: 'font/woff2', body: Buffer.from('wOF2-data') };

  it('downloads each font file once and points the style sheet at the copies', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fonts-'));
    writeFileSync(join(dir, 'stale.woff2'), 'old');
    const { impl, asked } = fakeFetch({
      [sheet]: { type: 'text/css', body: CSS },
      'https://fonts.test/a/robot-latin.woff2': ok,
      'https://fonts.test/a/robot-ext.woff2': ok,
    });
    const result = await bundleFonts(head, dir, () => null, impl);
    expect(result?.files).toBe(2);
    expect(result?.css).not.toContain('https://');
    expect(result?.css).toMatch(/url\(\.\/fonts\/[0-9a-f]{16}\.woff2\)/);
    expect(readdirSync(dir)).toHaveLength(2); // the stale file is gone, the shared address was taken once
    expect(readFileSync(join(dir, readdirSync(dir)[0]), 'utf8')).toBe('wOF2-data');
    expect(asked[0].headers['user-agent']).toMatch(/Chrome/); // so the provider sends woff2
  });

  it('keeps the provider when the style sheet cannot be fetched', async () => {
    const warnings: string[] = [];
    const { impl } = fakeFetch({});
    const result = await bundleFonts(
      head,
      mkdtempSync(join(tmpdir(), 'fonts-')),
      (m: string) => {
        warnings.push(m);
        return null;
      },
      impl,
    );
    expect(result).toBeNull();
    expect(warnings[0]).toMatch(/load them from the provider/);
  });

  it('leaves a file it cannot get as it is and reports it', async () => {
    const warnings: string[] = [];
    const { impl } = fakeFetch({
      [sheet]: { type: 'text/css', body: CSS },
      'https://fonts.test/a/robot-latin.woff2': ok,
    });
    const result = await bundleFonts(
      head,
      mkdtempSync(join(tmpdir(), 'fonts-')),
      (m: string) => {
        warnings.push(m);
        return null;
      },
      impl,
    );
    expect(result?.files).toBe(1);
    expect(result?.css).toContain('https://fonts.test/a/robot-ext.woff2');
    expect(warnings.some((w) => w.includes('robot-ext'))).toBe(true);
  });

  it('does nothing for provider none', async () => {
    const { impl, asked } = fakeFetch({});
    expect(
      await bundleFonts(
        { fonts: { sans: 'Robot', provider: 'none' } },
        mkdtempSync(join(tmpdir(), 'fonts-')),
        () => null,
        impl,
      ),
    ).toBeNull();
    expect(asked).toEqual([]);
  });
});

describe('the style sheet of a self-hosted deck', () => {
  it('uses the downloaded faces instead of the @import', () => {
    const css = fontsCss(
      { fonts: { sans: 'Robot' } },
      '@font-face { font-family: Robot; src: url(./fonts/a.woff2); }',
    );
    expect(css).toContain('url(./fonts/a.woff2)');
    expect(css).not.toContain('@import');
    expect(css).toContain('--slidev-font-sans: "Robot"');
  });
  it('keeps the roots` imports first in theme.css', () => {
    const css = themeCss(
      [],
      { fonts: { sans: 'Robot' } },
      '@font-face { font-family: Robot; src: url(./fonts/a.woff2); }',
    );
    expect(css.startsWith('@font-face')).toBe(true);
  });
  it('accepts the address of a css2 endpoint as the provider, with the explicit opt-in', () => {
    const fonts = { sans: 'Robot', provider: 'http://127.0.0.1:9/css2', allowCustomProvider: true };
    expect(fontsUrl(resolveFonts(fonts))).toBe(
      'http://127.0.0.1:9/css2?family=Robot:wght@200;400;600&display=swap',
    );
    expect(fontsUrl(resolveFonts({ sans: 'Robot', provider: 'javascript:alert(1)' }))).toBeNull();
  });
});

describe('bundleFonts: what is not taken', () => {
  const head = {
    fonts: {
      sans: 'Robot',
      weights: '400',
      provider: 'https://fonts.test/css2',
      allowCustomProvider: true,
    },
  };
  const sheet = fontsUrl(resolveFonts(head.fonts))!;
  const run = (table: Parameters<typeof fakeFetch>[0]) => {
    const warnings: string[] = [];
    const { impl } = fakeFetch(table);
    return bundleFonts(
      head,
      mkdtempSync(join(tmpdir(), 'fonts-')),
      (m: string) => (warnings.push(m), null),
      impl,
    ).then((result) => ({ result, warnings }));
  };

  it('keeps only the @font-face rules of the sheet: no @import, no other rule', async () => {
    const css = `@import url(https://evil.test/x.css);\nbody { background: url(https://evil.test/p.png); }\n${CSS}`;
    const { result } = await run({
      [sheet]: { type: 'text/css', body: css },
      'https://fonts.test/a/robot-latin.woff2': { type: 'font/woff2', body: Buffer.from('wOF2-1') },
      'https://fonts.test/a/robot-ext.woff2': { type: 'font/woff2', body: Buffer.from('wOF2-2') },
    });
    expect(result?.css).not.toContain('evil.test');
    expect(result?.css).not.toContain('@import');
    expect(result?.css).not.toContain('body');
    expect(result?.css).toContain('@font-face');
  });
  it('refuses a file that does not start like a font (HTML, an image, a script)', async () => {
    const { result, warnings } = await run({
      [sheet]: { type: 'text/css', body: CSS },
      'https://fonts.test/a/robot-latin.woff2': { type: 'font/woff2', body: '<html>x</html>' },
      'https://fonts.test/a/robot-ext.woff2': { type: 'font/woff2', body: '<svg onload=1>' },
    });
    expect(result).toBeNull();
    expect(warnings.filter((w) => w.includes('does not start like a font'))).toHaveLength(2);
  });
  it('refuses a provider answer that is not a style sheet', async () => {
    const { result, warnings } = await run({ [sheet]: { type: 'text/html', body: CSS } });
    expect(result).toBeNull();
    expect(warnings[0]).toContain('did not answer with a style sheet');
  });
  it('refuses addresses that are not public, also for the provider itself', async () => {
    const warnings: string[] = [];
    const local = {
      fonts: { sans: 'Robot', provider: 'http://127.0.0.1:9/css2', allowCustomProvider: true },
    };
    const result = await bundleFonts(
      local,
      mkdtempSync(join(tmpdir(), 'fonts-')),
      (m: string) => (warnings.push(m), null),
      undefined,
      { allowLocal: false },
    );
    expect(result).toBeNull();
    expect(warnings.join()).toContain('not a public address');
  });
});

describe('sniffFont and onlyFontFaces', () => {
  it('knows woff2, woff, otf and ttf', () => {
    expect(sniffFont(Buffer.from('wOF2....'))).toBe('.woff2');
    expect(sniffFont(Buffer.from('wOFF....'))).toBe('.woff');
    expect(sniffFont(Buffer.from('OTTO....'))).toBe('.otf');
    expect(sniffFont(Buffer.from([0, 1, 0, 0, 9]))).toBe('.ttf');
    expect(sniffFont(Buffer.from('<svg'))).toBeNull();
  });
  it('drops comments and everything that is not a font face', () => {
    expect(onlyFontFaces('/* c */ @import "x"; a{b:c} @font-face { src: url(x) }').trim()).toBe(
      '@font-face { src: url(x) }',
    );
  });
});
