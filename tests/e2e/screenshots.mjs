// `npm run screenshots`: saves a picture of every layout (light and dark) and of the controls
// to docs/screenshots/, so they can be compared by eye with Slidev. Uses the showcase deck.
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { launch, serve } from './browser.mjs';

const OUT = 'docs/screenshots';
const LAYOUTS = ['cover', 'intro', 'default', 'center', 'fact', 'full', 'image', 'image-left', 'image-right', 'iframe', 'iframe-left', 'iframe-right', 'none', 'quote', 'section', 'statement', 'two-cols', 'two-cols-header', 'end'];

if (!process.env.SKIP_BUILD) execSync('SLIDES_FILE=tests/e2e/showcase/slides.md node scripts/generate.mjs && node node_modules/@angular/cli/bin/ng.js build --output-path dist/showcase && node scripts/generate.mjs', { stdio: 'inherit', env: { ...process.env, SLIDES_FILE: 'tests/e2e/showcase/slides.md' } });
mkdirSync(OUT, { recursive: true });
const { server, port } = await serve('dist/showcase/browser');
const browser = await launch();

for (const scheme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width: 980, height: 552 }, colorScheme: scheme });
  const open = async (path) => {
    await page.goto(`http://localhost:${port}${path}`);
    await page.waitForFunction(() => /clicks \d+\/\d+/.test(document.querySelector('#hud')?.innerText ?? ''));
    await page.mouse.move(480, 200); // away from the bar, which only shows at the bottom left
    await page.waitForTimeout(400);
  };
  for (const [i, name] of LAYOUTS.entries()) {
    await open(`/${i + 1}`);
    await page.screenshot({ path: `${OUT}/layout-${name}-${scheme}.png` });
  }
  await open('/26');
  await page.mouse.move(40, 520);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/nav-bar-${scheme}.png` });
  await page.mouse.click(480, 300, { button: 'right' });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/context-menu-${scheme}.png` });
  await page.keyboard.press('Escape');
  await page.keyboard.press('o');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/overview-${scheme}.png` });
  await page.close();
}
await browser.close();
server.close();
console.log(`saved pictures in ${OUT}/`);
