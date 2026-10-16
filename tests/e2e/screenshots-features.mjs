// Part of `npm run screenshots`: a picture of every feature slide of the phase 2 deck
// (code, math, diagrams, Monaco, marks, alerts, ...), light and dark, at the last click.
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { launch, serve } from './browser.mjs';

const OUT = 'docs/screenshots';
// slide number -> picture name. Slide 14 (tweet, bluesky, video) needs the network, so it has no picture.
const SLIDES = {
  2: 'code',
  3: 'code-lines',
  4: 'code-highlight-steps',
  5: 'snippets',
  6: 'code-group',
  7: 'magic-move',
  8: 'math',
  9: 'diagrams',
  10: 'monaco',
  11: 'monaco-run',
  12: 'twoslash',
  13: 'components',
  15: 'marks-and-motion',
  16: 'markdown-extras',
};

if (!process.env.SKIP_BUILD) {
  const ng = 'node node_modules/@angular/cli/bin/ng.js build --output-path dist/phase2';
  try {
    execSync(`node scripts/generate.mjs && ${ng}`, {
      stdio: 'inherit',
      env: { ...process.env, SLIDES_FILE: 'tests/e2e/phase2/slides.md' },
    });
  } finally {
    execSync('node scripts/generate.mjs', { stdio: 'ignore' });
  }
}
mkdirSync(OUT, { recursive: true });
const tinySvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect width="40" height="20" fill="teal"/></svg>';
const { server, port } = await serve('dist/phase2/browser', (req, res) => {
  if (!req.url.startsWith('/plantuml/svg/')) return false;
  res.setHeader('content-type', 'image/svg+xml');
  res.end(tinySvg);
  return true;
});
const browser = await launch();

for (const scheme of ['light', 'dark']) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    colorScheme: scheme,
  });
  for (const [no, name] of Object.entries(SLIDES)) {
    await page.goto(`http://localhost:${port}/${no}?clicks=999`);
    await page.waitForFunction(() =>
      /clicks \d+\/\d+/.test(document.querySelector('#hud')?.innerText ?? ''),
    );
    await page.mouse.move(640, 300);
    // Monaco and the diagrams load after the page; marks and motion animate.
    await page
      .waitForFunction(() => !document.querySelector('[data-slide-ng-waitfor]'), null, {
        timeout: 15000,
      })
      .catch(() => {});
    await page.waitForTimeout(['10', '11'].includes(no) ? 2500 : 1200);
    await page.screenshot({ path: `${OUT}/feature-${name}-${scheme}.png` });
  }
  await page.close();
}
await browser.close();
server.close();
console.log(`saved feature pictures in ${OUT}/`);
