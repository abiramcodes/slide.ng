// Where the Angular app is built for a deck.
//   A deck inside this repository (tests, examples, `npm start`) is built in place.
//   Any other deck (a folder made by `slide-ng create`) gets a working copy of the app in `<deck>/.slide-ng/app`,
//   made fresh from this package each time, so nothing is ever written into the installed package.
import { cpSync, existsSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve, sep } from 'node:path';
import { packageRoot } from './package-root.mjs';

/** True when the deck is part of this package's own folder (and not an installed copy in node_modules). */
export function isInPlace(entry) {
  const path = resolve(entry);
  return (
    path.startsWith(packageRoot + sep) &&
    !path.includes(`${sep}node_modules${sep}`) &&
    !path.includes(`${sep}.slide-ng${sep}`)
  );
}

export const appRootFor = (entry) =>
  isInPlace(entry) ? packageRoot : join(dirname(resolve(entry)), '.slide-ng', 'app');

/** The `ng` program of this package's @angular/cli, wherever npm put it. */
export function ngBinary() {
  const pkg = createRequire(join(packageRoot, 'package.json')).resolve('@angular/cli/package.json');
  return join(dirname(pkg), 'bin', 'ng.js');
}

const RUNTIME_FILES = [
  'angular.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.worker.json',
  'uno.config.mjs',
  'proxy.conf.mjs',
];

/**
 * Makes the folder the app is built in and returns it. For a deck outside this package it is a copy of `src/`,
 * the Angular and TypeScript settings and `public/`; the generated slides (`src/slides/generated`) are left out, the generator writes them.
 */
export function prepareApp(entry) {
  const root = appRootFor(entry);
  if (root === packageRoot) return root;

  // Only these parts of the working folder are replaced; `.angular/cache` stays, so the second build is faster.
  rmSync(join(root, 'src'), { recursive: true, force: true });
  mkdirSync(root, { recursive: true });
  cpSync(join(packageRoot, 'src'), join(root, 'src'), {
    recursive: true,
    filter: (from) => !from.endsWith(`${sep}slides${sep}generated`),
  });
  cpSync(join(packageRoot, 'public'), join(root, 'public'), { recursive: true });
  for (const file of RUNTIME_FILES) cpSync(join(packageRoot, file), join(root, file));
  writeFileSync(
    join(root, 'package.json'),
    '{ "name": "slide-ng-app", "private": true, "type": "module" }\n',
  );

  // Use the packages next to this one (Angular and friends). Without a copy of its own, npm has put them higher up and the lookup finds them.
  if (existsSync(join(packageRoot, 'node_modules')) && !existsSync(join(root, 'node_modules'))) {
    symlinkSync(join(packageRoot, 'node_modules'), join(root, 'node_modules'), 'dir');
  }
  return root;
}
