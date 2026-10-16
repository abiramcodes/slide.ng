import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import {
  check,
  confine,
  hostAllowed,
  originAllowed,
  parseCookies,
  readBody,
  safeEqual,
  safeNext,
} from './auth.mjs';

const ctx = { token: 'tok123', password: '', auth: 'cookie456', remote: false, hostnames: [] };
const req = (headers: Record<string, string>, url = '/__slide-ng/slide/1') =>
  ({ headers, url }) as any;
const good = {
  host: 'localhost:4230',
  origin: 'http://localhost:4230',
  'x-slide-ng-token': 'tok123',
};

describe('safeEqual', () => {
  it('compares texts of any length', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
    expect(safeEqual(undefined, 'x')).toBe(false);
  });
});

describe('hostAllowed', () => {
  it('lets localhost in, with or without a port', () => {
    for (const h of ['localhost', 'localhost:4230', '127.0.0.1:4230', '[::1]:4230'])
      expect(hostAllowed(h, ctx)).toBe(true);
  });
  it('refuses other names (DNS rebinding) and other addresses unless --remote', () => {
    expect(hostAllowed('evil.example.com', ctx)).toBe(false);
    expect(hostAllowed('localhost.evil.com', ctx)).toBe(false);
    expect(hostAllowed('192.168.1.5:4230', ctx)).toBe(false);
    expect(hostAllowed('192.168.1.5:4230', { ...ctx, remote: true })).toBe(true);
    expect(hostAllowed('evil.example.com', { ...ctx, remote: true })).toBe(false);
  });
  it('knows extra names', () => {
    expect(hostAllowed('my-laptop:4230', { ...ctx, hostnames: ['my-laptop'] })).toBe(true);
  });
  it('refuses missing or odd values', () => {
    for (const h of [undefined, '', 'a b', 'host/path', 'localhost:99999999'])
      expect(hostAllowed(h as string, ctx)).toBe(false);
  });
});

describe('originAllowed', () => {
  it('accepts no origin and the server own origin', () => {
    expect(originAllowed(undefined, 'localhost:4230')).toBe(true);
    expect(originAllowed('http://localhost:4230', 'localhost:4230')).toBe(true);
  });
  it('refuses other sites, other ports and the string null', () => {
    expect(originAllowed('http://evil.com', 'localhost:4230')).toBe(false);
    expect(originAllowed('http://localhost:9999', 'localhost:4230')).toBe(false);
    expect(originAllowed('null', 'localhost:4230')).toBe(false);
  });
});

describe('check', () => {
  it('lets a good request through', () => {
    expect(check(req(good), ctx)).toBeNull();
  });
  it('rejects a wrong or missing token', () => {
    expect(check(req({ ...good, 'x-slide-ng-token': 'nope' }), ctx)?.status).toBe(403);
    expect(check(req({ host: good.host, origin: good.origin }), ctx)?.error).toBe('bad token');
  });
  it('reads the token from the address for WebSockets', () => {
    expect(
      check(req({ host: good.host, origin: good.origin }, '/__slide-ng/ws?token=tok123'), ctx),
    ).toBeNull();
    expect(
      check(req({ host: good.host, origin: good.origin }, '/__slide-ng/ws?token=bad'), ctx)?.status,
    ).toBe(403);
  });
  it('rejects a wrong Origin even with the right token', () => {
    expect(check(req({ ...good, origin: 'http://evil.com' }), ctx)?.error).toBe(
      'origin not allowed',
    );
  });
  it('rejects a wrong Host', () => {
    expect(check(req({ ...good, host: 'evil.com' }), ctx)?.error).toBe('host not allowed');
  });
  it('needs the password cookie when a password is set', () => {
    const withPw = { ...ctx, password: 'secret' };
    expect(check(req(good), withPw)?.status).toBe(401);
    expect(check(req({ ...good, cookie: 'slide-ng-auth=wrong' }), withPw)?.status).toBe(401);
    expect(check(req({ ...good, cookie: 'a=b; slide-ng-auth=cookie456' }), withPw)).toBeNull();
  });
  it('the login address works without the cookie, and still checks Host and Origin', () => {
    const withPw = { ...ctx, password: 'secret' };
    expect(
      check(req({ host: good.host }), withPw, { needToken: false, needLogin: false }),
    ).toBeNull();
    expect(
      check(req({ host: good.host, origin: 'http://evil.com' }), withPw, {
        needToken: false,
        needLogin: false,
      })?.status,
    ).toBe(403);
  });
  it('the session address does not need a token', () => {
    expect(check(req({ host: good.host }), ctx, { needToken: false })).toBeNull();
  });
});

describe('parseCookies', () => {
  it('reads a cookie header', () => {
    expect(parseCookies('a=1; b=two=2')).toEqual({ a: '1', b: 'two=2' });
    expect(parseCookies(undefined)).toEqual({});
  });
});

describe('confine', () => {
  const root = mkdtempSync(join(tmpdir(), 'slide-ng-confine-'));
  const outside = mkdtempSync(join(tmpdir(), 'slide-ng-outside-'));
  mkdirSync(join(root, 'sub'));
  writeFileSync(join(outside, 'secret.txt'), 'x');
  symlinkSync(outside, join(root, 'link'));

  it('accepts files inside the project, also new ones', () => {
    expect(confine(root, 'sub/a.ts')).toBe(join(root, 'sub/a.ts'));
    expect(confine(root, 'new/dir/b.ts')).toBe(join(root, 'new/dir/b.ts'));
  });
  it('rejects ../ traversal', () => {
    expect(confine(root, '../../etc/passwd')).toBeNull();
    expect(confine(root, 'sub/../../x')).toBeNull();
  });
  it('rejects absolute paths', () => {
    expect(confine(root, '/etc/passwd')).toBeNull();
    expect(confine(root, join(root, 'sub/a.ts'))).toBeNull();
  });
  it('rejects the root itself, empty names, null bytes and non-text', () => {
    for (const p of ['', '.', 'sub/..', 'a\0b', 5, null])
      expect(confine(root, p as string)).toBeNull();
  });
  it('rejects a symlink that leads out of the project', () => {
    expect(confine(root, 'link/secret.txt')).toBeNull();
  });
});

describe('readBody', () => {
  it('reads a small body', async () => {
    expect(await readBody(Readable.from(['{"a":', '1}']) as any, 100)).toBe('{"a":1}');
  });
  it('refuses a huge body with 413 and stops reading', async () => {
    const big = Readable.from([Buffer.alloc(60), Buffer.alloc(60)]);
    await expect(readBody(big as any, 100)).rejects.toMatchObject({ status: 413 });
  });
});

describe('safeNext', () => {
  it('keeps paths of this server and drops everything else', () => {
    expect(safeNext('/presenter/2?x=1')).toBe('/presenter/2?x=1');
    for (const n of [
      '//evil.com',
      'https://evil.com',
      '/\\evil.com',
      'javascript:1',
      undefined,
      '/a\r\nSet-Cookie: x=1',
    ])
      expect(safeNext(n as string)).toBe('/');
  });
});
