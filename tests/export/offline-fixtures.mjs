// Stand-ins for the internet in the offline tests: a "remote" picture server and a fake font provider, both on 127.0.0.1.
// They count their requests, and `stop()` shuts them, so a test can prove the built deck does not need them any more.
import { readFileSync } from 'node:fs';
import http from 'node:http';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
// Any real font file will do as the stand-in; KaTeX ships woff2 files.
const FONT_FILE = new URL('../../node_modules/katex/dist/fonts/KaTeX_Main-Regular.woff2', import.meta.url);

function listen(handler) {
  const server = http.createServer(handler);
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const stop = () => { server.closeAllConnections(); return new Promise((done) => server.close(done)); };
    ok({ server, origin, stop });
  }));
}

/** A server whose every answer is a PNG. `hits()` says how often it was asked. */
export async function remotePictures() {
  let hits = 0;
  const s = await listen((req, res) => { hits++; res.setHeader('content-type', 'image/png'); res.end(PNG); });
  return { ...s, hits: () => hits };
}

/**
 * A font provider like Google Fonts: `/css2?family=...` answers a style sheet whose @font-face points at `/files/<name>.woff2`.
 * `family` is the name the sheet declares (the deck asks for the same name).
 */
export async function fontProvider(family) {
  const asked = { css: 0, files: 0, userAgents: [] };
  let origin = '';
  const s = await listen((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/css2') {
      asked.css++;
      asked.userAgents.push(req.headers['user-agent'] ?? '');
      res.setHeader('content-type', 'text/css');
      return res.end(`/* latin */\n@font-face {\n  font-family: '${family}';\n  font-style: normal;\n  font-weight: 400;\n  font-display: swap;\n  src: url(${origin}/files/${family}-latin.woff2) format('woff2');\n}\n`);
    }
    if (url.pathname.startsWith('/files/')) { asked.files++; res.setHeader('content-type', 'font/woff2'); return res.end(readFileSync(FONT_FILE)); }
    res.statusCode = 404; res.end('no');
  });
  origin = s.origin;
  return { ...s, asked, cssUrl: `${s.origin}/css2` };
}
