// `npm run test:e2e` (second half): builds tests/e2e/showcase/slides.md (a deck that uses every feature)
// and checks it in a real browser. The topic files in showcase/ do the checking.
import { execSync } from 'node:child_process';
import { launch, reporter, serve } from './browser.mjs';
import { makeContext } from './helpers.mjs';

const ng = 'node node_modules/@angular/cli/bin/ng.js build --output-path dist/showcase';
if (!process.env.SKIP_BUILD) {
  try {
    execSync(`node scripts/generate.mjs && ${ng}`, {
      stdio: 'inherit',
      env: { ...process.env, SLIDES_FILE: 'tests/e2e/showcase/slides.md' },
    });
  } finally {
    execSync('node scripts/generate.mjs', { stdio: 'ignore' }); // put the generated files of the normal deck back
  }
}
const { server, port } = await serve('dist/showcase/browser');
const browser = await launch();
const t = reporter();
const ctx = makeContext(`http://localhost:${port}`, browser, t);

for (const topic of ['layouts', 'controls', 'shortcuts', 'transitions', 'builtins']) {
  console.log(`\n== ${topic}`);
  await (await import(`./showcase/${topic}.mjs`)).run(ctx);
}

t.ok('no console errors or warnings', ctx.problems.length === 0, JSON.stringify(ctx.problems));
await browser.close();
server.close();
process.exit(t.done());
