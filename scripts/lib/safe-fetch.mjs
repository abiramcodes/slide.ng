// The only way the generator downloads things from the network (remote pictures, web fonts).
// A deck is not always written by the person who builds it, so a download must not become a request to the builder's own
// machine or network: it must not reach loopback, link-local (cloud metadata is 169.254.169.254), private or other
// non-public addresses, not even through a redirect or a name that resolves to one. It also must not fill the memory:
// the body is read as a stream and stops at a byte limit (Content-Length is honoured first).
//
// Tests that use a local HTTP server as the "remote" opt in with SLIDE_NG_ALLOW_LOCAL_FETCH=1 (or `allowLocal: true`).
import { lookup as dnsLookup } from 'node:dns';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { BlockList, isIP } from 'node:net';
import { Readable } from 'node:stream';

export const ALLOW_LOCAL_ENV = 'SLIDE_NG_ALLOW_LOCAL_FETCH';
export const MAX_REDIRECTS = 3;

const blocked = new BlockList();
for (const [net, bits] of [
  ['0.0.0.0', 8], // "this network"
  ['10.0.0.0', 8], // private
  ['100.64.0.0', 10], // carrier-grade NAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local, cloud metadata
  ['172.16.0.0', 12], // private
  ['192.0.0.0', 24], // protocol assignments
  ['192.0.2.0', 24], // documentation
  ['192.168.0.0', 16], // private
  ['198.18.0.0', 15], // benchmarking
  ['198.51.100.0', 24], // documentation
  ['203.0.113.0', 24], // documentation
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved and broadcast
])
  blocked.addSubnet(net, bits, 'ipv4');
for (const [net, bits] of [
  ['::', 128], // unspecified
  ['::1', 128], // loopback
  ['fc00::', 7], // unique local
  ['fe80::', 10], // link-local
  ['fec0::', 10], // site-local (old)
  ['ff00::', 8], // multicast
  ['2001:db8::', 32], // documentation
])
  blocked.addSubnet(net, bits, 'ipv6');

/** The IPv4 address hidden in an IPv6 one (`::ffff:127.0.0.1`, NAT64 `64:ff9b::7f00:1`, 6to4 `2002:7f00:1::`), or null. */
function embeddedV4(ip) {
  const lower = ip.toLowerCase();
  const dotted = /^(?:::ffff:|::|64:ff9b::)(\d{1,3}(?:\.\d{1,3}){3})$/.exec(lower);
  if (dotted) return dotted[1];
  const hex = /^(?:::ffff:|64:ff9b::)([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(lower);
  if (hex) {
    const n = (parseInt(hex[1], 16) << 16) | parseInt(hex[2], 16);
    return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
  }
  const six = /^2002:([0-9a-f]{1,4}):([0-9a-f]{1,4})(?::|$)/.exec(lower);
  if (six) {
    const n = (parseInt(six[1], 16) << 16) | parseInt(six[2], 16);
    return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
  }
  return null;
}

/** True for an address on the public internet (anything that is not loopback, link-local, private, multicast, reserved...). */
export function isPublicAddress(ip) {
  const family = isIP(ip);
  if (!family) return false;
  if (family === 6) {
    const v4 = embeddedV4(ip);
    if (v4) return isPublicAddress(v4);
    return !blocked.check(ip, 'ipv6');
  }
  return !blocked.check(ip, 'ipv4');
}

const allowedLocal = (options) => options.allowLocal ?? process.env[ALLOW_LOCAL_ENV] === '1';

/** `dns.lookup` that refuses to answer with a non-public address (the check and the connection use the same answer). */
function guardedLookup(allowLocal) {
  return (hostname, options, callback) => {
    dnsLookup(hostname, { ...options, all: true }, (error, addresses) => {
      if (error) return callback(error);
      const bad = addresses.find((a) => !allowLocal && !isPublicAddress(a.address));
      if (bad)
        return callback(
          new Error(`${hostname} is ${bad.address}, which is not a public address (refused)`),
        );
      if (options?.all) return callback(null, addresses);
      callback(null, addresses[0].address, addresses[0].family);
    });
  };
}

/** A `fetch`-like function over node:http(s) that checks every address it connects to. No redirects are followed. */
export function pinnedFetch(allowLocal) {
  const lookup = guardedLookup(allowLocal);
  return (url, init = {}) =>
    new Promise((resolve, reject) => {
      const target = new URL(url);
      const request = target.protocol === 'https:' ? httpsRequest : httpRequest;
      const req = request(
        target,
        { method: 'GET', headers: init.headers ?? {}, lookup, signal: init.signal },
        (res) => {
          const headers = new Headers();
          for (const [k, v] of Object.entries(res.headers))
            for (const one of [].concat(v)) headers.append(k, one);
          const empty = [204, 205, 304].includes(res.statusCode) || res.statusCode < 200;
          resolve(
            new Response(empty ? null : Readable.toWeb(res), { status: res.statusCode, headers }),
          );
        },
      );
      req.on('error', reject);
      req.end();
    });
}

/** The body of `res` as a Buffer; throws as soon as it is clear that it is longer than `maxBytes`. */
export async function readLimited(res, maxBytes) {
  const declared = Number(res.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes)
    throw new Error(
      `larger than ${Math.round(maxBytes / 1024 / 1024)} MB (Content-Length says ${declared})`,
    );
  if (!res.body) return Buffer.alloc(0);
  const chunks = [];
  let size = 0;
  const reader = res.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new Error(`larger than ${Math.round(maxBytes / 1024 / 1024)} MB`);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

/**
 * GET `url` and read at most `maxBytes`. Redirects are followed by hand, at most 3, and each one is checked like the first
 * request (http or https only, no address that is not public). Returns `{ status, ok, headers, bytes, url }` and throws on a
 * refused address, too many redirects, a body that is too big or a network error.
 * @param {string} url
 * @param {{ maxBytes: number, timeoutMs?: number, headers?: Record<string, string>, fetchImpl?: typeof fetch, allowLocal?: boolean }} options
 */
export async function safeFetch(url, options) {
  const allowLocal = allowedLocal(options);
  const fetchImpl = options.fetchImpl ?? pinnedFetch(allowLocal);
  const signal = AbortSignal.timeout(options.timeoutMs ?? 20_000);
  let current = String(url);
  for (let hop = 0; ; hop++) {
    const target = new URL(current);
    if (!['http:', 'https:'].includes(target.protocol))
      throw new Error(`${target.protocol} addresses are not downloaded`);
    // An address written as a number needs no lookup, so it is judged here; a name is judged when it is resolved.
    const literal = target.hostname.replace(/^\[|\]$/g, '');
    if (isIP(literal) && !allowLocal && !isPublicAddress(literal))
      throw new Error(`${literal} is not a public address (refused)`);
    const res = await fetchImpl(current, { signal, redirect: 'manual', headers: options.headers });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      await res.body?.cancel().catch(() => {});
      if (hop >= MAX_REDIRECTS) throw new Error(`more than ${MAX_REDIRECTS} redirects`);
      current = new URL(res.headers.get('location'), current).href;
      continue;
    }
    const bytes = res.ok ? await readLimited(res, options.maxBytes) : Buffer.alloc(0);
    if (!res.ok) await res.body?.cancel().catch(() => {});
    return { status: res.status, ok: res.ok, headers: res.headers, bytes, url: current };
  }
}
