import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { manifestJson, pwaEnabled, serviceWorkerSource, writePwa } from './pwa.mjs';

describe('pwaEnabled', () => {
  it('is on for true and build only', () => {
    expect(pwaEnabled({ pwa: true })).toBe(true);
    expect(pwaEnabled({ pwa: 'build' })).toBe(true);
    expect(pwaEnabled({ pwa: 'dev' })).toBe(false);
    expect(pwaEnabled({ pwa: false })).toBe(false);
    expect(pwaEnabled({})).toBe(false);
  });
});

describe('manifestJson', () => {
  it('names the app after the deck and has no icons', () => {
    const m = manifestJson({ title: 'My talk about everything' });
    expect(m.name).toBe('My talk about everything');
    expect(m.short_name.length).toBeLessThanOrEqual(12);
    expect(m.start_url).toBe('./');
    expect(m).not.toHaveProperty('icons');
  });
});

describe('serviceWorkerSource', () => {
  it('lists the files and names the cache', () => {
    const text = serviceWorkerSource(['index.html', 'a/b.js'], 'v1');
    expect(text).toContain("'slide-ng-v1'");
    expect(text).toContain('["index.html","a/b.js"]');
    expect(() => new Function(text)).not.toThrow(); // it is valid JavaScript
  });
});

describe('writePwa', () => {
  it('writes the manifest and a worker that stores every file but downloads and itself', () => {
    const dir = mkdtempSync(join(tmpdir(), 'slide-ng-pwa-'));
    mkdirSync(join(dir, 'remote-assets'));
    for (const f of ['index.html', 'main.js', 'talk.pdf', 'og-image.png', '.slide-ng-build', 'remote-assets/a.png']) writeFileSync(join(dir, f), 'x');
    const count = writePwa(dir, { title: 'T' });
    const sw = readFileSync(join(dir, 'sw.js'), 'utf8');
    expect(count).toBe(4);
    for (const f of ['index.html', 'main.js', 'remote-assets/a.png', 'manifest.webmanifest']) expect(sw).toContain(`"${f}"`);
    for (const f of ['talk.pdf', 'og-image.png', 'slide-ng-build']) expect(sw).not.toContain(f);
    expect(JSON.parse(readFileSync(join(dir, 'manifest.webmanifest'), 'utf8')).name).toBe('T');
  });
  it('changes the cache name when a file changes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'slide-ng-pwa-'));
    writeFileSync(join(dir, 'index.html'), 'a');
    writePwa(dir, {});
    const first = /slide-ng-(\w+)'/.exec(readFileSync(join(dir, 'sw.js'), 'utf8'))![1];
    writeFileSync(join(dir, 'index.html'), 'a longer file');
    writePwa(dir, {});
    expect(/slide-ng-(\w+)'/.exec(readFileSync(join(dir, 'sw.js'), 'utf8'))![1]).not.toBe(first);
  });
});
