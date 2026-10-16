// The generator's part of the theme contract (docs/THEMES.md): copies the roots into the app, and writes
// `layers.ts`, `setup.ts` and `theme.css` from what they bring. Also returns their UnoCSS settings and files for class scanning.
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { findLayerFiles, layersSource } from './layers.mjs';
import { scanRoots } from './scan-roots.mjs';
import { syncRoots } from './sync-roots.mjs';

/** `src/slides/generated/setup.ts`: the Angular providers that roots bring in `setup/providers.ts` (default export: an array). */
export function setupSource(roots) {
  const withSetup = roots.filter((r) => existsSync(join(r.dir, 'setup', 'providers.ts')));
  const imports = withSetup.map((r, i) => `import providers${i} from './roots/${r.id}/setup/providers';`);
  const list = withSetup.map((_, i) => `...providers${i}`).join(', ');
  return `// GENERATED: providers from the setup/providers.ts of themes, addons and the deck - do not edit
import type { Provider } from '@angular/core';
${imports.join('\n')}

export const SETUP_PROVIDERS: Provider[] = [${list}];
`;
}

/** `src/slides/generated/theme.css`: the style sheets of the roots (`styles/index.css`), weakest first. */
export function themeCss(roots) {
  const imports = roots.filter((r) => existsSync(join(r.dir, 'styles', 'index.css'))).map((r) => `@import './roots/${r.id}/styles/index.css';`);
  return imports.length ? `${imports.join('\n')}\n` : '/* no theme styles */\n';
}

/**
 * Does everything for the roots of `deck`: copies them, finds layouts, components and layers, loads UnoCSS settings.
 * Sets `deck.layouts`, `deck.components` and `deck.layers`. `write(path, text)` is the generator's change-only writer.
 */
export async function applyRoots(deck, out, write, warn) {
  const generated = resolve(out);
  syncRoots(deck.roots, generated);
  const scanned = scanRoots(deck.roots);
  scanned.problems.forEach(warn);
  deck.layouts = scanned.layouts;
  deck.components = scanned.components;

  // `src/app/layers` is the older place for layers; roots come after it and win.
  const layerFiles = findLayerFiles([
    { dir: 'src/app/layers', importDir: '../../app/layers' },
    ...deck.roots.map((r) => ({ dir: join(r.dir, 'layers'), importDir: `./roots/${r.id}/layers` })),
  ]);
  deck.layers = Object.keys(layerFiles);
  write(`${out}layers.ts`, layersSource(layerFiles));
  write(`${out}setup.ts`, setupSource(deck.roots));
  write(`${out}theme.css`, themeCss(deck.roots));

  // A root's uno.config.mjs is plain JavaScript that default-exports (part of) a UnoCSS config.
  const unoConfigs = [];
  for (const root of deck.roots) {
    const file = join(root.dir, 'uno.config.mjs');
    if (existsSync(file)) unoConfigs.push((await import(`${pathToFileURL(file).href}?v=${Date.now()}`)).default);
  }
  return { unoConfigs };
}
