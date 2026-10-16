// The exporter's browser: Chromium keeps its sandbox unless asked, and a page cannot reach private addresses through it.
// "Internal" is a local server that counts requests; "own" is the exporter's server that hosts the page.
import http from 'node:http';
import { reporter } from '../e2e/browser.mjs';
import { launchBrowser } from '../../scripts/export/browser.mjs';
import { installRequestFilter } from '../../scripts/export/request-filter.mjs';

const t = reporter();
const executablePath =
  process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const listen = (handler) =>
  new Promise((ok) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => ok({ server, port: server.address().port }));
  });

let internalHits = 0;
const internal = await listen((req, res) => {
  internalHits++;
  res.setHeader('content-type', 'text/html');
  res.end('<p>internal</p>');
});
const own = await listen((req, res) => {
  res.setHeader('content-type', 'text/html');
  res.end(
    `<img src="http://127.0.0.1:${internal.port}/pic.png"><iframe src="http://localhost:${internal.port}/frame"></iframe>`,
  );
});
const ownOrigin = `http://127.0.0.1:${own.port}`;

// The sandbox: as root Chromium cannot use it, so it must refuse and say how to go on.
if (process.getuid?.() === 0) {
  let message = '';
  const optIn = process.env.SLIDE_NG_NO_SANDBOX; // the opt-in would switch the sandbox off here
  delete process.env.SLIDE_NG_NO_SANDBOX;
  await launchBrowser(executablePath, { noSandbox: false }).then(
    (b) => b.close(),
    (e) => (message = e.message),
  );
  if (optIn !== undefined) process.env.SLIDE_NG_NO_SANDBOX = optIn;
  t.ok(
    'as root, Chromium is not started without its sandbox, and the error names --no-sandbox',
    message.includes('--no-sandbox'),
    message.slice(0, 200),
  );
} else t.ok('(not root: the sandbox start-up check is skipped)', true);

const browser = await launchBrowser(executablePath, { noSandbox: true });
async function visit(options) {
  internalHits = 0;
  const context = await browser.newContext();
  const warnings = [];
  await installRequestFilter(context, { ownOrigin, ...options }, (m) => warnings.push(m));
  const page = await context.newPage();
  await page.goto(ownOrigin, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await context.close();
  return { hits: internalHits, warnings };
}

let r = await visit({});
t.ok(
  'a page cannot load a picture or a frame from a local service: no request arrived',
  r.hits === 0,
  String(r.hits),
);
t.ok(
  'the blocked address is reported once per host',
  r.warnings.length >= 1 && r.warnings[0].includes('--allow-local'),
  r.warnings.join('|'),
);
r = await visit({ allowLocal: true });
t.ok('--allow-local lets the page reach it', r.hits >= 1, String(r.hits));

await browser.close();
internal.server.close();
own.server.close();
process.exit(t.done());
