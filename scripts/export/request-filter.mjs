// While the exporter shows a deck in Chromium, the deck can ask for any address: an iframe or a picture of
// http://localhost:5432, of a router at 192.168.0.1 or of the cloud metadata service at 169.254.169.254. What loads ends
// up in the PDF or the pictures, which the person then shares. So requests to loopback, private and link-local addresses
// are blocked, except to the exporter's own server (`ownOrigin`). `--allow-local` switches the filter off.
import { lookup as dnsLookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { isPublicAddress } from '../lib/safe-fetch.mjs';

const PASS = new Set(['data:', 'blob:', 'about:']);
const LOCAL_NAME = /(^|\.)(localhost|local|internal|localdomain|home\.arpa)$/i;

/**
 * @param {{ ownOrigin: string, allowLocal?: boolean, lookup?: (host: string) => Promise<{ address: string }[]> }} options
 * @returns {(url: string) => Promise<boolean>} true when the request may go out
 */
export function requestFilter({
  ownOrigin,
  allowLocal = false,
  lookup = (h) => dnsLookup(h, { all: true }),
}) {
  const seen = new Map(); // host -> Promise<boolean>
  const hostAllowed = async (hostname) => {
    const host = hostname.replace(/^\[|\]$/g, '');
    if (isIP(host)) return isPublicAddress(host);
    if (LOCAL_NAME.test(host)) return false;
    try {
      const answers = await lookup(host);
      return answers.length > 0 && answers.every((a) => isPublicAddress(a.address));
    } catch {
      return true; // a name that does not resolve cannot reach anything; the browser reports the failure itself
    }
  };
  return async (rawUrl) => {
    if (allowLocal) return true;
    let url;
    try {
      url = new URL(rawUrl);
    } catch {
      return false;
    }
    if (PASS.has(url.protocol)) return true;
    if (url.origin === ownOrigin) return true;
    if (!['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)) return false; // file:, ftp:, ...
    if (!seen.has(url.hostname)) seen.set(url.hostname, hostAllowed(url.hostname));
    return seen.get(url.hostname);
  };
}

/** Puts the filter on a Playwright context; `warn` hears about each blocked address once. */
export async function installRequestFilter(context, options, warn = () => {}) {
  if (options.allowLocal) return;
  const allowed = requestFilter(options);
  const told = new Set();
  await context.route('**/*', async (route) => {
    const url = route.request().url();
    if (await allowed(url)) return route.continue();
    const host = new URL(url).host;
    if (!told.has(host)) {
      told.add(host);
      warn(`blocked a request to ${host}: not a public address (use --allow-local to allow it)`);
    }
    return route.abort('blockedbyclient');
  });
}
