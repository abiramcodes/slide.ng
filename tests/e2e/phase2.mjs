// `npm run test:e2e` (third part): builds tests/e2e/phase2/slides.md (code and content features)
// and checks it in a real browser. The topic files in phase2/ do the checking.
import { execSync } from 'node:child_process';
import { launch, reporter, serve } from './browser.mjs';
import { makeContext } from './helpers.mjs';

const ng = 'node node_modules/@angular/cli/bin/ng.js build --output-path dist/phase2';
if (!process.env.SKIP_BUILD) {
  try {
    execSync(`node scripts/generate.mjs && ${ng}`, { stdio: 'inherit', env: { ...process.env, SLIDES_FILE: 'tests/e2e/phase2/slides.md' } });
  } finally {
    execSync('node scripts/generate.mjs', { stdio: 'ignore' }); // put the generated files of the normal deck back
  }
}
const { server, port } = await serve('dist/phase2/browser');
const real = await launch();
// Pages here may use the clipboard (the copy button test reads it back).
const browser = {
  newPage: async (opts) => (await real.newContext({ ...opts, permissions: ['clipboard-read', 'clipboard-write'] })).newPage(),
};
const t = reporter();
const ctx = makeContext(`http://localhost:${port}`, browser, t);

const topics = process.argv.slice(2).length ? process.argv.slice(2) : ['code', 'magic', 'math'];
for (const topic of topics) {
  console.log(`\n== ${topic}`);
  await (await import(`./phase2/${topic}.mjs`)).run(ctx);
}

t.ok('no console errors or warnings', ctx.problems.length === 0, JSON.stringify(ctx.problems));
await real.close();
server.close();
process.exit(t.done());
