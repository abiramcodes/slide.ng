// Where the Angular app and the generator live, and how to run them for one deck.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { ngBinary, prepareApp } from './app-root.mjs';
import { packageRoot } from './package-root.mjs';
import { claimDirectory, markDirectory } from './safe-dir.mjs';

export { packageRoot };

function run(args, { cwd, env, quiet }) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: quiet ? 'pipe' : 'inherit',
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    if (quiet) process.stderr.write(`${result.stdout ?? ''}${result.stderr ?? ''}`);
    throw new Error(
      `${args[0].includes('generate') ? 'generating the slides' : 'the Angular build'} failed (exit code ${result.status})`,
    );
  }
}

/** Writes the generated slides for `entry` (an absolute path to the deck's markdown file). */
export function generateSlides(
  entry,
  { quiet = false, env = {}, appRoot = prepareApp(entry) } = {},
) {
  run([join(packageRoot, 'scripts/generate.mjs')], {
    cwd: appRoot,
    env: { SLIDES_FILE: entry, ...env },
    quiet,
  });
}

/**
 * Generates and builds the deck into `workDir` (a folder this tool owns and empties, see safe-dir.mjs).
 * Resolves to the folder with `index.html` inside it. `base` is the address the deck will be served under.
 * `env` reaches the generator and the build (SLIDE_NG_BUILD and friends, see scripts/lib/build-options.mjs).
 */
export function buildDeck({
  entry,
  workDir,
  base = '/',
  quiet = false,
  cwd = process.cwd(),
  env = {},
}) {
  claimDirectory(workDir, cwd);
  const appRoot = prepareApp(entry); // this package itself for decks inside it, a working copy for any other deck
  generateSlides(entry, { quiet, appRoot, env: { SLIDE_NG_BASE: base, ...env } });
  run([ngBinary(), 'build', '--output-path', workDir, '--base-href', base], {
    cwd: appRoot,
    env: { SLIDES_FILE: entry, ...env },
    quiet,
  });
  markDirectory(workDir);
  return join(workDir, 'browser');
}
