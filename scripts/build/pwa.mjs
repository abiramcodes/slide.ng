// Offline support for a built deck (headmatter `pwa: true` or `pwa: build`).
//
// A small service worker, written by hand and generated after the build: it lists every file of the build,
// stores them all when the page is first opened, and from then on answers from that store. We chose this over
// Angular's service worker (@angular/service-worker + ngsw-config.json) because a deck wants exactly one rule,
// "keep everything", which is 30 readable lines here and a configuration file, a package and a build option there.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { ICONS } from './pwa-icons.mjs';

const SKIP = [
  /\.pdf$/i,
  /^og-image\./,
  /^\.slide-ng-build$/,
  /^sw\.js$/,
  /^manifest\.webmanifest$/,
  /\.map$/,
]; // downloads and helper files are not for the cache

/** Is the headmatter's `pwa` on for a build? (`true` and `build`; `dev` is for the dev server, which has no worker.) */
export function pwaEnabled(headmatter) {
  return headmatter.pwa === true || headmatter.pwa === 'build';
}

// Every file under `dir`, as paths relative to it with `/` separators.
function listFiles(dir, from = dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory()
      ? listFiles(path, from)
      : [relative(from, path).split(sep).join('/')];
  });
}

/** The web app manifest. `iconFiles` are the names of the icons that exist in the build (see pwa-icons.mjs). */
export function manifestJson(headmatter, iconFiles = []) {
  const name = String(headmatter.title ?? 'slide.ng');
  const icons = ICONS.filter((i) => iconFiles.includes(i.file)).map((i) => ({
    src: i.file,
    sizes: `${i.size}x${i.size}`,
    type: 'image/png',
    purpose: i.purpose,
  }));
  return {
    name,
    short_name: name.slice(0, 12),
    start_url: './',
    scope: './',
    display: 'fullscreen',
    theme_color: '#121212',
    background_color: '#121212',
    ...(icons.length ? { icons } : {}),
  };
}

/** The text of the service worker. `files` are relative to the folder the worker sits in; `version` names the cache. */
export function serviceWorkerSource(files, version) {
  return `// Written by slide-ng build (pwa). Stores every file of the deck, then answers from the store.
const CACHE = 'slide-ng-${version}';
const FILES = ${JSON.stringify(files)};

self.addEventListener('install', (event) => {
  // Relative addresses are relative to this file, so the deck can live under any base path.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  // A new version of the deck has a new cache name; the old ones go.
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n.startsWith('slide-ng-') && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      // A deck address such as /3 or /presenter/2 is answered by the app's index.html.
      if (request.mode === 'navigate') return caches.match('index.html').then((page) => page || fetch(request));
      return fetch(request);
    }),
  );
});
`;
}

/** Writes manifest.webmanifest and sw.js into the build folder (icons already written there are listed and cached). Returns how many files the worker stores. */
export function writePwa(distDir, headmatter) {
  const files = listFiles(distDir).filter((f) => !SKIP.some((re) => re.test(f)));
  const manifest = 'manifest.webmanifest';
  writeFileSync(
    join(distDir, manifest),
    JSON.stringify(manifestJson(headmatter, files), null, 2) + '\n',
  );
  files.push(manifest);
  // The version changes whenever a file changes, so a visitor with an old copy gets the new one.
  const version = createHash('sha256')
    .update(files.map((f) => f + readFileSync(join(distDir, f)).length).join('|'))
    .digest('hex')
    .slice(0, 12);
  writeFileSync(join(distDir, 'sw.js'), serviceWorkerSource(files, version));
  return files.length;
}
