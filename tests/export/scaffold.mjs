// `slide-ng create` end to end: makes a deck in a temporary folder, links the package into its node_modules (this repository
// stands in for an installed `slide-ng`, there is no registry to install from), builds the deck from there, and checks the site.
// Part of `npm run test:export`.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { launch, reporter } from '../e2e/browser.mjs';
import { serveDirectory } from '../../scripts/export/static-server.mjs';

const t = reporter();
const repo = resolve('.');
const scratch = mkdtempSync(join(tmpdir(), 'slide-ng-scaffold-'));
const run = promisify(execFile);

// ---- create
const created = await run(process.execPath, [join(repo, 'bin/slide-ng.mjs'), 'create', 'my-deck'], { cwd: scratch, encoding: 'utf8' });
const deck = join(scratch, 'my-deck');
const pkg = JSON.parse(readFileSync(join(deck, 'package.json'), 'utf8'));
t.ok('create writes slides.md, package.json, README.md and .gitignore', ['slides.md', 'package.json', 'README.md', '.gitignore'].every((f) => existsSync(join(deck, f))));
t.ok('package.json is named after the folder and depends on slide-ng', pkg.name === 'my-deck' && /^\^\d/.test(pkg.dependencies['slide-ng']), JSON.stringify(pkg.dependencies));
t.ok('package.json has dev, build, export and format scripts', ['dev', 'build', 'export', 'format'].every((s) => pkg.scripts[s]?.startsWith('slide-ng')));
t.ok('no template holes are left', !/\{\{/.test(readFileSync(join(deck, 'package.json'), 'utf8') + readFileSync(join(deck, 'README.md'), 'utf8')));
t.ok('create tells what to do next', /npm install/.test(created.stdout));
const again = await run(process.execPath, [join(repo, 'bin/slide-ng.mjs'), 'create', 'my-deck'], { cwd: scratch }).then(() => '', (e) => e.stderr);
t.ok('create refuses a folder that has files', /is not empty/.test(again));

// ---- stand in for `npm install`: node_modules/slide-ng points at this repository
mkdirSync(join(deck, 'node_modules'));
symlinkSync(repo, join(deck, 'node_modules/slide-ng'), 'dir');
const generatedBefore = statSync(join(repo, 'src/slides/generated/index.ts')).mtimeMs;
const bin = join(deck, 'node_modules/slide-ng/bin/slide-ng.mjs');

// ---- format leaves the generated file alone (it is already tidy), then build
const formatted = await run(process.execPath, [bin, 'format'], { cwd: deck, encoding: 'utf8' });
t.ok('format says the scaffold is already formatted', /already formatted/.test(formatted.stdout), formatted.stdout.trim());
const built = await run(process.execPath, [bin, 'build'], { cwd: deck, encoding: 'utf8' });
t.ok('build makes dist/index.html', existsSync(join(deck, 'dist/index.html')) && /Built \d+ slides/.test(built.stdout), built.stdout.trim().split('\n').pop());
t.ok('the build used a working copy and left the package alone', statSync(join(repo, 'src/slides/generated/index.ts')).mtimeMs === generatedBefore && existsSync(join(deck, '.slide-ng/app/src/slides/generated/index.ts')));

// ---- open it
const served = await serveDirectory(join(deck, 'dist'), '/');
const browser = await launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const problems = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(m.text()); });
page.on('pageerror', (e) => problems.push(String(e)));
await page.goto(`${served.origin}/1`);
await page.waitForFunction(() => /clicks \d+\/\d+/.test(document.querySelector('#hud')?.innerText ?? ''));
t.ok('the scaffold deck opens with its title', (await page.locator('h1').first().innerText()) === 'Welcome to slide.ng');
t.ok('the document title is the deck title', (await page.title()).includes('Welcome to slide.ng'), await page.title());
await page.keyboard.press('ArrowDown');
await page.waitForFunction(() => document.querySelector('#hud')?.innerText.startsWith('slide 2/'));
t.ok('the next slide has the click elements', (await page.locator('[v-click], .slidev-vclick-target').count()) >= 2);
t.ok('no console errors or warnings', problems.length === 0, problems.join('|'));
await browser.close();
await served.close();
process.exit(t.done());
