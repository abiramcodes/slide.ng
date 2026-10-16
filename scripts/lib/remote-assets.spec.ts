import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bundleRemoteAssets, findRemoteImages, localName, rewriteAddresses } from './remote-assets.mjs';

describe('findRemoteImages', () => {
  it('finds markdown images, img tags, css urls and frontmatter keys', () => {
    const text = [
      '![a](https://x.test/a.png)', '![b](<https://x.test/b.png> "title")',
      '<img class="w-4" src="https://x.test/c.jpg" />', "style: background: url('https://x.test/d.gif')",
      'image: https://x.test/e.webp', 'backgroundImage: "https://x.test/f.png"',
    ].join('\n');
    expect(findRemoteImages(text).sort()).toEqual(['https://x.test/a.png', 'https://x.test/b.png', 'https://x.test/c.jpg', 'https://x.test/d.gif', 'https://x.test/e.webp', 'https://x.test/f.png']);
  });
  it('ignores plain links, local images and addresses inside code that are not image syntax', () => {
    expect(findRemoteImages('[link](https://x.test/page) ![l](/local.png) see https://x.test/a.png')).toEqual([]);
  });
});

describe('localName', () => {
  it('is a stable hash with an extension from the content type', () => {
    expect(localName('https://x.test/a.png', 'image/png')).toMatch(/^[0-9a-f]{16}\.png$/);
    expect(localName('https://x.test/a.png', 'image/png')).toBe(localName('https://x.test/a.png', 'image/png; charset=x'));
    expect(localName('https://x.test/a', 'image/svg+xml')).toMatch(/\.svg$/);
    expect(localName('https://x.test/a', 'image/unknown')).toMatch(/\.img$/);
  });
});

describe('rewriteAddresses', () => {
  it('replaces every use, longest address first', () => {
    const map = { 'https://x.test/a': 'remote-assets/1.png', 'https://x.test/a.png': 'remote-assets/2.png' };
    expect(rewriteAddresses('![](https://x.test/a.png) ![](https://x.test/a)', map)).toBe('![](remote-assets/2.png) ![](remote-assets/1.png)');
  });
});

describe('bundleRemoteAssets', () => {
  const png = Buffer.from('89504e470d0a1a0a', 'hex');
  const fakeFetch = async (url: string) => {
    if (url.endsWith('/ok.png')) return new Response(png, { headers: { 'content-type': 'image/png' } });
    if (url.endsWith('/page.html')) return new Response('<p>hi</p>', { headers: { 'content-type': 'text/html' } });
    return new Response('nope', { status: 404 });
  };
  it('downloads images, writes them by hash and rewrites the slides', async () => {
    const folder = join(mkdtempSync(join(tmpdir(), 'slide-ng-remote-')), 'remote-assets');
    const slides = [{ content: '![x](https://x.test/ok.png)', frontmatter: { image: 'https://x.test/ok.png' }, note: 'see https://x.test/ok.png' }];
    const warnings: string[] = [];
    const count = await bundleRemoteAssets(slides, folder, (m: string) => { warnings.push(m); }, fakeFetch as never);
    const [file] = readdirSync(folder);
    expect(count).toBe(1);
    expect(readFileSync(join(folder, file))).toEqual(png);
    expect(slides[0].content).toBe(`![x](remote-assets/${file})`);
    expect(slides[0].frontmatter.image).toBe(`remote-assets/${file}`);
    expect(warnings).toEqual([]);
  });
  it('leaves non-images and failures alone, with a warning', async () => {
    const folder = join(mkdtempSync(join(tmpdir(), 'slide-ng-remote-')), 'remote-assets');
    const slides = [{ content: '![a](https://x.test/page.html) ![b](https://x.test/missing.png)', frontmatter: {}, note: null }];
    const warnings: string[] = [];
    const count = await bundleRemoteAssets(slides, folder, (m: string) => { warnings.push(m); }, fakeFetch as never);
    expect(count).toBe(0);
    expect(slides[0].content).toContain('https://x.test/page.html');
    expect(warnings.length).toBe(2);
    expect(readdirSync(folder)).toEqual([]);
  });
});
