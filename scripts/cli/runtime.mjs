// Where the Angular app and the generator live, and how to run them for one deck.
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { claimDirectory, markDirectory } from './safe-dir.mjs';

/** The folder of this package: `src/` (the app), `scripts/` (the generator), `angular.json`. */
export const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function run(args, { cwd, env, quiet }) {
  const result = spawnSync(process.execPath, args, { cwd, env: { ...process.env, ...env }, stdio: quiet ? 'pipe' : 'inherit', encoding: 'utf8' });
  if (result.status !== 0) {
    if (quiet) process.stderr.write(`${result.stdout ?? ''}${result.stderr ?? ''}`);
    throw new Error(`${args[0].includes('generate') ? 'generating the slides' : 'the Angular build'} failed (exit code ${result.status})`);
  }
}

/** Writes the generated slides for `entry` (an absolute path to the deck's markdown file). */
export function generateSlides(entry, { quiet = false } = {}) {
  run([join(packageRoot, 'scripts/generate.mjs')], { cwd: packageRoot, env: { SLIDES_FILE: entry }, quiet });
}

/**
 * Generates and builds the deck into `workDir` (a folder this tool owns and empties, see safe-dir.mjs).
 * Resolves to the folder with `index.html` inside it. `base` is the address the deck will be served under.
 */
export function buildDeck({ entry, workDir, base = '/', quiet = false, cwd = process.cwd() }) {
  claimDirectory(workDir, cwd);
  generateSlides(entry, { quiet });
  const ng = join(packageRoot, 'node_modules/@angular/cli/bin/ng.js');
  run([ng, 'build', '--output-path', workDir, '--base-href', base], { cwd: packageRoot, env: { SLIDES_FILE: entry }, quiet });
  markDirectory(workDir);
  return join(workDir, 'browser');
}
