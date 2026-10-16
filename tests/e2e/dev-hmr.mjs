// `npm run test:dev`: starts the dev server, edits slides.md five times and checks that
// the open page updates each time WITHOUT a full reload (a marker set on `window` must survive).
// Note: we edit body text. Changing a slide's title or frontmatter also changes the generated
// index.ts, and the dev server does a full reload for that (see docs/STATUS.md).
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { launch, reporter } from './browser.mjs';

const FILE = 'slides.md',
  PORT = 4210,
  URL_ = `http://localhost:${PORT}`;
const original = readFileSync(FILE, 'utf8');
const t = reporter();

// detached = own process group, so we can stop the dev runner and everything it started.
const dev = spawn('npm', ['start', '--', '--port', String(PORT)], {
  stdio: 'ignore',
  detached: true,
});
const stopDev = () => {
  try {
    process.kill(-dev.pid, 'SIGTERM');
  } catch {
    /* already gone */
  }
};
process.on('exit', stopDev);

async function waitForServer() {
  for (let i = 0; i < 180; i++) {
    try {
      if ((await fetch(URL_)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('dev server did not start');
}

let browser;
try {
  await waitForServer();
  browser = await launch();
  const page = await browser.newPage();
  const problems = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(m.text());
  });
  page.on('pageerror', (e) => problems.push(String(e)));
  await page.goto(`${URL_}/2`);
  await page.waitForFunction(
    () => /slide 2/.test(document.querySelector('#hud')?.innerText ?? ''),
    null,
    { timeout: 60000 },
  );
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    window['__marker'] = 'alive';
  });
  await page.locator('#ctr').click(); // counter is now 6; just reported below

  for (let n = 1; n <= 5; n++) {
    const started = Date.now();
    writeFileSync(
      FILE,
      original.replace('Count is {{ c.n() }}.', `Count is {{ c.n() }}. Edit ${n}.`),
    );
    let updated = true;
    try {
      await page.waitForFunction(
        (n) => document.querySelector('p')?.innerText.endsWith(`Edit ${n}.`),
        n,
        { timeout: 15000 },
      );
    } catch {
      updated = false;
    }
    await page.waitForTimeout(500);
    const marker = await page.evaluate(() => window['__marker']);
    const counter = await page
      .locator('#ctr')
      .innerText()
      .catch(() => '?');
    t.ok(
      `edit ${n}: page updated without reload`,
      updated && marker === 'alive',
      `${Date.now() - started}ms, marker=${marker}, ${counter}`,
    );
  }
  t.ok('no console errors in the browser', problems.length === 0, JSON.stringify(problems));
} finally {
  writeFileSync(FILE, original);
  await browser?.close();
  stopDev();
}
process.exit(t.done());
