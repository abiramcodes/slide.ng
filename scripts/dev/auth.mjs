// Who may talk to the dev server. Every request goes through `check` first.
//
// The server can write to slides.md and open a WebSocket that moves other people's slides,
// so it must not be reachable by a web page from another site or by a stranger on the network:
//   1. Host header: only localhost (and, with --remote, an IP address). A DNS rebinding page
//      reaches us under its own name, which is not on the list.
//   2. Origin header (every browser sends it on writes and WebSocket upgrades): must be this very server's address.
//   3. Password (only with --remote=password): a cookie that is given out after the right password was sent.
//   4. Token: a random value made when the server starts. A page learns it from /session (which
//      the checks above protect) and sends it with every write and WebSocket. Other sites cannot read it.
import { timingSafeEqual } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

export const API = '/__slide-ng';
export const COOKIE = 'slide-ng-auth';

/** Compare two secrets without leaking, through timing, how many characters matched. */
export function safeEqual(a, b) {
  const x = Buffer.from(String(a ?? '')),
    y = Buffer.from(String(b ?? ''));
  return x.length === y.length && timingSafeEqual(x, y);
}

/** `ctx`: { remote: boolean, hostnames: string[] (extra names we answer to) }. */
export function hostAllowed(host, ctx = {}) {
  if (typeof host !== 'string') return false;
  const m = /^(\[[0-9a-f:.]+\]|[^:/\s]+)(?::\d{1,5})?$/i.exec(host);
  if (!m) return false;
  const name = m[1].toLowerCase();
  if (['localhost', '127.0.0.1', '[::1]'].includes(name)) return true;
  if ((ctx.hostnames ?? []).some((h) => h.toLowerCase() === name)) return true;
  // An address is fine on the network (rebinding needs a name); with --remote it is how the others reach us.
  return !!ctx.remote && (/^\d{1,3}(\.\d{1,3}){3}$/.test(name) || name.startsWith('['));
}

/** No Origin header = not a browser page; the token still guards writes. Otherwise it must be our own address. */
export function originAllowed(origin, host) {
  if (origin == null) return true;
  try {
    return new URL(origin).host.toLowerCase() === String(host).toLowerCase();
  } catch {
    return false;
  }
}

export function parseCookies(header) {
  const out = {};
  for (const part of String(header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

export const hasAuthCookie = (req, ctx) =>
  safeEqual(parseCookies(req.headers.cookie)[COOKIE], ctx.auth);

export function tokenOf(req) {
  const fromHeader = req.headers['x-slide-ng-token'];
  if (typeof fromHeader === 'string') return fromHeader;
  return new URL(req.url, 'http://x').searchParams.get('token');
}

/**
 * The checks every request passes. Returns null when it may go on, or `{ status, error }`.
 * `needToken: false` is for /session and /login, which hand the token out; `needLogin: false` is for /login itself.
 */
export function check(req, ctx, { needToken = true, needLogin = true } = {}) {
  if (!hostAllowed(req.headers.host, ctx)) return { status: 403, error: 'host not allowed' };
  if (!originAllowed(req.headers.origin, req.headers.host))
    return { status: 403, error: 'origin not allowed' };
  if (needLogin && ctx.password && !hasAuthCookie(req, ctx))
    return { status: 401, error: 'password required' };
  if (needToken && !safeEqual(tokenOf(req), ctx.token)) return { status: 403, error: 'bad token' };
  return null;
}

/** `relativePath` joined to `root`, or null when it would leave `root` (absolute, `..`, a symlink out). The name is never used as it came. */
export function confine(root, relativePath) {
  if (
    typeof relativePath !== 'string' ||
    !relativePath ||
    relativePath.includes('\0') ||
    isAbsolute(relativePath)
  )
    return null;
  const full = resolve(root, relativePath);
  const rel = relative(root, full);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) return null;
  // A symlink inside the project could point outside: look at the real place of the closest folder that exists.
  let dir = dirname(full);
  for (;;) {
    try {
      const real = relative(realpathSync(root), realpathSync(dir));
      return real.startsWith('..') || isAbsolute(real) ? null : full;
    } catch {
      if (dir === dirname(dir)) return null;
      dir = dirname(dir);
    }
  }
}

/** Read a request body, giving up (413) as soon as it is bigger than `limit` bytes. */
export function readBody(req, limit) {
  return new Promise((resolveBody, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (data) => {
      const chunk = Buffer.from(data);
      size += chunk.length;
      if (size > limit) {
        // The caller answers 413 and hangs up; what arrives meanwhile is thrown away (a second reject does nothing).
        chunks.length = 0;
        reject(Object.assign(new Error('body too large'), { status: 413 }));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** A `next=` address after login: only a path on this server (no other site, no `//host`). */
export const safeNext = (next) =>
  typeof next === 'string' && /^\/(?![/\\])[^\r\n]*$/.test(next) ? next : '/';
