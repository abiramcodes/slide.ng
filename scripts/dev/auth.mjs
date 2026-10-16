// Who may talk to the dev server. Every request goes through `check` first.
//
// The server can write to slides.md and open a WebSocket that moves other people's slides,
// so it must not be reachable by a web page from another site or by a stranger on the network:
//   1. Host header: only localhost (and, with --remote, an IP address). A DNS rebinding page
//      reaches us under its own name, which is not on the list.
//   2. Origin header (every browser sends it on writes and WebSocket upgrades): must be this very server's address.
//   3. Password (always with --remote): a cookie, one per login, given out after the right password was sent; wrong
//      passwords are limited per client address (login-guard.mjs).
//   4. Token: a random value made when the server starts. A page learns it from /session (which
//      the checks above protect) and sends it with every write and WebSocket. Other sites cannot read it.
import { timingSafeEqual } from 'node:crypto';
import { closeSync, constants, lstatSync, openSync, realpathSync, writeSync } from 'node:fs';
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
  Boolean(ctx.sessions?.has(parseCookies(req.headers.cookie)[COOKIE]));

/**
 * Who is asking, for the limit on wrong passwords. The Angular dev server's proxy adds the address it saw as the last
 * `X-Forwarded-For` entry (earlier entries are whatever the client claimed, so they are not used).
 */
export function clientAddress(req) {
  const forwarded = String(req.headers['x-forwarded-for'] ?? '')
    .split(',')
    .pop()
    ?.trim();
  return (forwarded || req.socket?.remoteAddress || 'unknown').replace(/^::ffff:/, '');
}

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

/**
 * `relativePath` joined to `root`, or null when it would leave `root` (absolute, `..`, a symlink out). The name is never used as it came.
 * The real place of the file counts, not only its folder: a file that is itself a symlink must lead inside `root`.
 * With `{ write: true }` a symlink is refused as a target whatever it points to.
 */
export function confine(root, relativePath, { write = false } = {}) {
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
  let realRoot;
  try {
    realRoot = realpathSync(root);
  } catch {
    return null;
  }
  const inside = (real) => {
    const r = relative(realRoot, real);
    return !!r && !r.startsWith('..') && !isAbsolute(r);
  };
  // The file itself, when it exists (a dangling link exists as a link): its real place must be inside.
  let stat = null;
  try {
    stat = lstatSync(full);
  } catch {
    // does not exist yet: the closest folder that does is checked below
  }
  if (stat) {
    if (stat.isSymbolicLink() && write) return null;
    try {
      return inside(realpathSync(full)) ? full : null;
    } catch {
      return null;
    }
  }
  let dir = dirname(full);
  for (;;) {
    try {
      return inside(realpathSync(dir)) || realpathSync(dir) === realRoot ? full : null;
    } catch {
      if (dir === dirname(dir)) return null;
      dir = dirname(dir);
    }
  }
}

/** Overwrite an existing file without following a symlink (O_NOFOLLOW where the system has it, and an lstat check everywhere). */
export function safeWrite(file, text) {
  if (lstatSync(file).isSymbolicLink()) throw new Error('refusing to write through a symlink');
  const fd = openSync(file, constants.O_WRONLY | constants.O_TRUNC | (constants.O_NOFOLLOW ?? 0));
  try {
    writeSync(fd, text);
  } finally {
    closeSync(fd);
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
