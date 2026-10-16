// `npm run screenshots` (third part): pictures of the presenter page (three layouts), the notes page, the drawing toolbar,
// the camera bubble, the drag controls and the side editor, into docs/screenshots/. Uses dist/phase3 (made by `npm run test:e2e`)
// and, for the side editor, a short dev server session on a copy of the dev test deck.
import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { launch, serve } from './browser.mjs';

const OUT = 'docs/screenshots';
mkdirSync(OUT, { recursive: true });
if (!existsSync('dist/phase3/browser')) throw new Error('run `node tests/e2e/phase3.mjs` first: it builds dist/phase3');
const { server, port } = await serve('dist/phase3/browser');
const browser = await launch(['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ready = (page) => page.waitForFunction(() => /clicks \d+\/\d+/.test(document.querySelector('#hud')?.innerText ?? ''), null, { timeout: 60000 });

const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const presenter = await ctx.newPage();
await presenter.goto(`http://localhost:${port}/presenter/2?clicks=1`);
await ready(presenter);
await presenter.waitForTimeout(500);
for (const layout of [1, 2, 3]) {
  await presenter.evaluate((n) => localStorage.setItem('slidev-presenter-layout', String(n)), layout);
  await presenter.reload();
  await ready(presenter);
  await presenter.mouse.move(640, 300);
  await presenter.waitForTimeout(600);
  await presenter.screenshot({ path: `${OUT}/presenter-layout-${layout}.png` });
}
await presenter.evaluate(() => localStorage.setItem('slidev-presenter-layout', '1'));

const notes = await ctx.newPage();
await notes.goto(`http://localhost:${port}/notes`);
await notes.waitForTimeout(1500);
await notes.screenshot({ path: `${OUT}/notes-page.png` });

await presenter.close(); // an open presenter would pull this page along
await notes.close();
const play = await ctx.newPage();
await play.goto(`http://localhost:${port}/1`);
await ready(play);
await play.bringToFront();
await play.locator('#nav-drawing').click({ force: true });
await play.waitForTimeout(300);
const c = await play.locator('#slide-content').boundingBox();
await play.mouse.move(c.x + c.width * 0.2, c.y + c.height * 0.6);
await play.mouse.down();
await play.mouse.move(c.x + c.width * 0.5, c.y + c.height * 0.75, { steps: 8 });
await play.mouse.up();
await play.waitForTimeout(400);
await play.screenshot({ path: `${OUT}/drawing-toolbar.png` });
await play.locator('#nav-drawing').click({ force: true });

await play.locator('#nav-camera').click({ force: true });
await play.waitForFunction(() => document.querySelector('#web-camera video')?.videoWidth > 0, null, { timeout: 10000 });
await play.waitForTimeout(500);
await play.screenshot({ path: `${OUT}/camera-bubble.png` });
await play.locator('#nav-camera').click({ force: true });

await play.goto(`http://localhost:${port}/4`);
await ready(play);
const box = await play.locator('#d1').boundingBox();
await play.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
await play.waitForTimeout(400);
await play.screenshot({ path: `${OUT}/drag-controls.png` });
await ctx.close();
server.close();

// ---- the side editor needs the dev server
const WORK = 'tests/e2e/dev/work.md';
copyFileSync('tests/e2e/dev/slides.md', WORK);
copyFileSync('tests/e2e/dev/snippet.ts', 'tests/e2e/dev/work-snippet.ts');
const dev = spawn('npm', ['start', '--', '--port', '4222'], { stdio: 'ignore', detached: true, env: { ...process.env, SLIDES_FILE: WORK } });
try {
  for (let i = 0; i < 180; i++) { try { if ((await fetch('http://localhost:4222')).ok) break; } catch { /* not up */ } await sleep(1000); }
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:4222/2');
  await ready(page);
  await page.waitForTimeout(1500);
  await page.locator('#nav-editor').click({ force: true });
  await page.waitForFunction(() => document.querySelector('#editor-text')?.value.includes('# Two'), null, { timeout: 15000 });
  await page.mouse.move(640, 100);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/side-editor.png` });
} finally {
  try { process.kill(-dev.pid, 'SIGTERM'); } catch { /* gone */ }
  for (const f of [WORK, 'tests/e2e/dev/work-snippet.ts']) rmSync(f, { force: true });
  rmSync('tests/e2e/dev/.slide-ng', { recursive: true, force: true });
  await browser.close();
  spawn('node', ['scripts/generate.mjs'], { stdio: 'ignore' });
}
