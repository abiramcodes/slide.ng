import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveRequest, serveDirectory } from './static-server.mjs';

const root = mkdtempSync(join(tmpdir(), 'slide-ng-static-'));
mkdirSync(join(root, 'sub'));
writeFileSync(join(root, 'index.html'), '<p>home</p>');
writeFileSync(join(root, 'sub', 'a.js'), 'x');

describe('resolveRequest', () => {
  it('finds files under the base', () => {
    expect(resolveRequest(root, '/talk/', '/talk/sub/a.js')).toBe(join(root, 'sub', 'a.js'));
  });
  it('refuses paths outside the folder or the base', () => {
    expect(resolveRequest(root, '/', '/../../etc/passwd')).toBeNull();
    expect(resolveRequest(root, '/', '/%2e%2e/%2e%2e/etc/passwd')).toBeNull();
    expect(resolveRequest(root, '/talk/', '/other/sub/a.js')).toBeNull();
    expect(resolveRequest(root, '/', '/%zz')).toBeNull();
  });
});

describe('serveDirectory', () => {
  it('answers deck addresses with index.html and unknown files with 404', async () => {
    const s = await serveDirectory(root, '/');
    const home = await (await fetch(`${s.origin}/print?range=2`)).text();
    const missing = await fetch(`${s.origin}/nope.js`);
    const traversal = await (await fetch(`${s.origin}/..%2f..%2fetc%2fpasswd`)).text();
    await s.close();
    expect(home).toBe('<p>home</p>');
    expect(missing.status).toBe(404);
    expect(traversal).not.toContain('root:'); // it is just another deck address
  });
});
