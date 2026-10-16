// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { applyOffline, buildOptions } from '../lib/build-options.mjs';
import { classicPage, makeOffline } from './offline.mjs';
import { WORKER_SHIM, workerFiles } from './offline-workers.mjs';

const PAGE = `<!doctype html><html><head><base href="/"><title>T</title></head><body><app-root></app-root>
<link rel="modulepreload" href="chunk-A.js"><script src="main-X.js" type="module"></script></body></html>`;

describe('classicPage', () => {
  it('drops <base> and preloads and loads the entry as a classic script', () => {
    const { html, entry } = classicPage(PAGE);
    expect(entry).toBe('main-X.js');
    expect(html).not.toMatch(/<base|modulepreload|type="module"/);
    expect(html).toContain('<script defer src="main-X.js"></script>');
  });
  it('loads workers.js first when there are workers', () => {
    const { html } = classicPage(PAGE, { workers: true });
    expect(html.indexOf('workers.js')).toBeLessThan(html.indexOf('main-X.js'));
  });
  it('refuses a page without a module script', () => {
    expect(() => classicPage('<html></html>')).toThrow(/no module script/);
  });
});

describe('workerFiles', () => {
  it('finds worker names in any kind of quotes, once', () => {
    const text = 'new Worker(new URL(`worker-AB12.js`, x)); new URL("worker-AB12.js"); new URL(\'worker-Cd_3.js\')';
    expect(workerFiles(text)).toEqual(['worker-AB12.js', 'worker-Cd_3.js']);
  });
  it('the shim only handles file:// and falls back to the real Worker', () => {
    expect(WORKER_SHIM).toContain("location.protocol === 'file:'");
    expect(WORKER_SHIM).toContain('new Native(url, options)');
  });
});

describe('makeOffline', () => {
  it('folds a lazy chunk into one script and removes the chunk', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'offline-'));
    writeFileSync(join(dir, 'index.html'), PAGE);
    writeFileSync(join(dir, 'main-X.js'), 'import("./chunk-B.js").then((m) => { window.result = m.value; });');
    writeFileSync(join(dir, 'chunk-A.js'), 'export const a = 1;');
    writeFileSync(join(dir, 'chunk-B.js'), 'import { a } from "./chunk-A.js"; export const value = a + 41;');
    const result = await makeOffline(dir);
    expect(result).toMatchObject({ entry: 'main-X.js', removed: 2, workers: [] });
    expect(readdirSync(dir).sort()).toEqual(['index.html', 'main-X.js']);
    const script = readFileSync(join(dir, 'main-X.js'), 'utf8');
    expect(script).not.toMatch(/^import |\bimport\(["']\.\//m);
    // It runs as a plain script and the lazy chunk's code ran with it.
    const window: Record<string, unknown> = {};
    runInNewContext(script, { window, document: { currentScript: null } });
    await new Promise((done) => setTimeout(done, 10));
    expect(window['result']).toBe(42);
  });

  it('stores worker files as text in workers.js', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'offline-'));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), PAGE);
    writeFileSync(join(dir, 'main-X.js'), 'new Worker(new URL(`worker-W1.js`, import.meta.url), { type: "module" });');
    writeFileSync(join(dir, 'worker-W1.js'), 'self.postMessage("hi");');
    const result = await makeOffline(dir);
    expect(result.workers).toEqual(['worker-W1.js']);
    expect(readdirSync(dir).sort()).toEqual(['index.html', 'main-X.js', 'workers.js']);
    expect(readFileSync(join(dir, 'workers.js'), 'utf8')).toContain('worker-W1.js');
    expect(readFileSync(join(dir, 'main-X.js'), 'utf8')).toContain('__slideNgScriptUrl');
    expect(readFileSync(join(dir, 'index.html'), 'utf8').indexOf('workers.js')).toBeGreaterThan(0);
  });
});

describe('offline build settings', () => {
  it('forces hash routing and no service worker', () => {
    expect(applyOffline({ routerMode: 'history', pwa: true, title: 'x' })).toEqual({ routerMode: 'hash', pwa: false, title: 'x' });
  });
  it('reads the offline switch from the environment', () => {
    expect(buildOptions({ SLIDE_NG_OFFLINE: '1' }).offline).toBe(true);
    expect(buildOptions({}).offline).toBe(false);
  });
});
