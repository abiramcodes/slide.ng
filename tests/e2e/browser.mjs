// Small helpers shared by the browser tests: a static server, a browser, and assertions.
import { existsSync, readFileSync, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright-core';

// Serves a folder like a single-page app: unknown paths return index.html.
export function serve(root) {
  const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.ico': 'image/x-icon' };
  const server = http.createServer((req, res) => {
    let file = path.join(root, req.url.split('?')[0]);
    if (!existsSync(file) || statSync(file).isDirectory()) file = path.join(root, 'index.html');
    res.setHeader('content-type', types[path.extname(file)] ?? 'text/plain');
    res.end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, () => resolve({ server, port: server.address().port })));
}

// Chromium location: set CHROME_PATH to use another one.
export const launch = () => chromium.launch({
  executablePath: process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});

// Collects pass/fail lines and counts them.
export function reporter() {
  const r = { pass: 0, fail: 0 };
  r.ok = (name, cond, detail = '') => {
    console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + detail : ''}`);
    cond ? r.pass++ : r.fail++;
  };
  r.done = () => {
    console.log(`\n${r.pass} passed, ${r.fail} failed`);
    return r.fail ? 1 : 0;
  };
  return r;
}
