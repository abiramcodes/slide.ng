// The companion server's answers. Every request goes through `check` (auth.mjs) first; nothing is done for a request
// that fails it. Writes need a JSON body, so a plain HTML form from another site cannot send one.
import { API, COOKIE, check, readBody, safeEqual } from './auth.mjs';
import { writeDrawing, MAX_DRAWING } from './drawings-store.mjs';
import { HttpError } from './http-error.mjs';
import { MAX_FILE, writeMonaco } from './monaco-write.mjs';
import { readSlide, writeDrag, writeSlide } from './slides-write.mjs';
import { parseDeck } from '../lib/parse-deck.mjs';

const json = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The request handler: `http.createServer(createHandler(ctx))`. */
export function createHandler(ctx) {
  // Writes run one after the other, so two quick moves cannot overwrite each other's lines.
  let queue = Promise.resolve();
  const serial = (job) => (queue = queue.then(job, job));

  async function body(req, limit) {
    if (!/^application\/json\b/i.test(req.headers['content-type'] ?? '')) throw new HttpError(415, 'JSON expected');
    try { return JSON.parse(await readBody(req, limit)); } catch (e) { throw e.status ? e : new HttpError(400, 'bad JSON'); }
  }

  const number = (text) => (/^\d{1,6}$/.test(text) ? Number(text) : NaN);

  async function route(req, res, url) {
    const path = url.pathname.slice(API.length);
    const method = req.method;
    const unlocked = path === '/session' || path === '/login'; // these hand out the token
    const denied = check(req, ctx, { needToken: !unlocked, needLogin: path !== '/login' });
    if (denied) throw new HttpError(denied.status, denied.error);

    if (path === '/session' && method === 'GET') return json(res, 200, { token: ctx.token, remote: ctx.remote });

    if (path === '/login' && method === 'POST') {
      const { password } = await body(req, 1_000);
      if (!ctx.password || !safeEqual(password, ctx.password)) { await sleep(400); throw new HttpError(401, 'wrong password'); }
      return json(res, 200, { ok: true }, { 'set-cookie': `${COOKIE}=${ctx.auth}; HttpOnly; SameSite=Strict; Path=${API}` });
    }

    let m;
    if ((m = /^\/slides\/(\d+)\/drag$/.exec(path)) && method === 'POST') {
      const { site, pos } = await body(req, 2_000);
      await serial(() => writeDrag(ctx, number(m[1]), site, pos));
      return json(res, 200, { ok: true });
    }
    if ((m = /^\/slides\/(\d+)\/source$/.exec(path))) {
      if (method === 'GET') return json(res, 200, { raw: await readSlide(ctx, number(m[1])) });
      if (method === 'PUT') {
        const { raw } = await body(req, MAX_FILE);
        if (typeof raw !== 'string') throw new HttpError(400, 'raw must be text');
        await serial(() => writeSlide(ctx, number(m[1]), raw));
        return json(res, 200, { ok: true });
      }
    }
    if ((m = /^\/drawings\/(\d+)$/.exec(path)) && method === 'PUT') {
      const { svg } = await body(req, MAX_DRAWING + 1_000);
      const { slides } = await parseDeck(ctx.entry);
      await serial(async () => writeDrawing(ctx, number(m[1]), svg, slides.length));
      return json(res, 200, { ok: true });
    }
    if ((m = /^\/monaco\/([\w-]{1,40})$/.exec(path)) && method === 'PUT') {
      const { content } = await body(req, MAX_FILE + 1_000);
      await serial(async () => writeMonaco(ctx, m[1], content));
      return json(res, 200, { ok: true });
    }
    throw new HttpError(404, 'not found');
  }

  return async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      if (!url.pathname.startsWith(`${API}/`)) throw new HttpError(404, 'not found');
      await route(req, res, url);
    } catch (e) {
      const status = e instanceof HttpError || e.status ? e.status : 500;
      if (status === 500) console.error('[dev-server]', e);
      if (!res.headersSent) {
        // After a too big body the client may still be sending: answer, then hang up.
        if (status === 413) res.on('finish', () => req.destroy());
        json(res, status, { error: status === 500 ? 'server error' : e.message }, status === 413 ? { connection: 'close' } : {});
      }
    }
  };
}
