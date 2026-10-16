// `npm run test:e2e` (fourth part): builds tests/e2e/phase3/slides.md (presenter, drawing, drag, camera ...)
// and checks it in a real browser, one file per topic. `node tests/e2e/phase3.mjs sync` runs one topic.
import { execSync } from 'node:child_process';
import { launch, reporter, serve } from './browser.mjs';
import { makeContext } from './helpers.mjs';

const ng = 'node node_modules/@angular/cli/bin/ng.js build --output-path dist/phase3';
if (!process.env.SKIP_BUILD) {
  try {
    execSync(`node scripts/generate.mjs && ${ng}`, { stdio: 'inherit', env: { ...process.env, SLIDES_FILE: 'tests/e2e/phase3/slides.md' } });
  } finally {
    execSync('node scripts/generate.mjs', { stdio: 'ignore' }); // put the generated files of the normal deck back
  }
}
const { server, port } = await serve('dist/phase3/browser');
// Fake camera, microphone and screen so the recording tests can run without devices.
const browser = await launch([
  '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream',
  '--auto-select-desktop-capture-source=Entire screen', '--enable-usermedia-screen-capturing',
]);
const t = reporter();
const ctx = makeContext(`http://localhost:${port}`, browser, t);

const only = process.argv[2];
for (const topic of ['sync', 'presenter', 'laser', 'drawing', 'camera', 'settings', 'drag', 'layout']) {
  if (only && only !== topic) continue;
  let run;
  try { run = (await import(`./phase3/${topic}.mjs`)).run; } catch (e) { if (e.code === 'ERR_MODULE_NOT_FOUND') continue; throw e; }
  console.log(`\n== ${topic}`);
  await run(ctx);
}

t.ok('no console errors or warnings', ctx.problems.length === 0, JSON.stringify(ctx.problems));
await browser.close();
server.close();
process.exit(t.done());
