// A small static file server for a built deck, used by `export` and `build --download` / `--og-image`.
// Unknown paths get index.html (the deck is a single-page app). `base` is the sub-path the deck was built for.
import { createReadStream, existsSync, statSync } from 'node:fs';
import http from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.map': 'application/json',
  '.txt': 'text/plain',
};

/** The file inside `root` that a request path names, or null (outside the folder, or not a file). */
export function resolveRequest(root, base, pathname) {
  let path;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (!path.startsWith(base)) return null;
  const file = normalize(join(root, path.slice(base.length)));
  if (file !== resolve(root) && !file.startsWith(resolve(root) + sep)) return null; // `..` got us out
  return existsSync(file) && statSync(file).isFile() ? file : null;
}

/** Starts the server on a free port of 127.0.0.1. Resolves `{ server, port, origin, close }`. */
export function serveDirectory(root, base = '/') {
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://x').pathname;
    const file = resolveRequest(root, base, pathname);
    // Anything that is not a file and has no extension is a deck address (/3, /print): the app answers it.
    const asset =
      file ?? (extname(pathname) ? null : resolveRequest(root, base, base + 'index.html'));
    if (!asset) {
      res.statusCode = 404;
      return res.end('not found');
    }
    res.setHeader('content-type', TYPES[extname(asset)] ?? 'application/octet-stream');
    createReadStream(asset).pipe(res);
  });
  return new Promise((resolvePromise) =>
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolvePromise({
        server,
        port,
        origin: `http://127.0.0.1:${port}`,
        close: () => {
          server.closeAllConnections();
          return new Promise((done) => server.close(done));
        },
      });
    }),
  );
}
