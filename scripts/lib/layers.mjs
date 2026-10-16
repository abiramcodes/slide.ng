// Global and per-slide layers: `src/app/layers/{global-top,global-bottom,slide-top,slide-bottom}.ts`.
// A deck adds a file with that name (a standalone component, `export default class`) and it shows on the slides.
// This finds out which files exist and writes generated/layers.ts, which imports exactly those.
import { existsSync } from 'node:fs';

export const LAYER_NAMES = ['global-top', 'global-bottom', 'slide-top', 'slide-bottom'];
const camel = (name) => name.replace(/-(\w)/g, (_, c) => c.toUpperCase());

/** @returns {string[]} the layer names that have a file in `dir` */
export function findLayers(dir = 'src/app/layers') {
  return LAYER_NAMES.filter((name) => existsSync(`${dir}/${name}.ts`));
}

/** The source of generated/layers.ts. */
export function layersSource(found) {
  const imports = found.map((n) => `import ${camel(n)} from '../../app/layers/${n}';`);
  const entries = LAYER_NAMES.map((n) => `  '${n}': ${found.includes(n) ? camel(n) : 'null'},`);
  return `// GENERATED: the layer components found in src/app/layers - do not edit
import type { Type } from '@angular/core';
${imports.join('\n')}

export const LAYERS: Record<string, Type<unknown> | null> = {
${entries.join('\n')}
};
`;
}
