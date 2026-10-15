// Builds the CSS for every UnoCSS class name found in the given files.
// We call UnoCSS from this script (instead of its own command) because the dev server
// does a full page reload when its CSS file is rewritten, and we only write when the CSS changed.
import { readFileSync, readdirSync } from 'node:fs';
import { createGenerator } from '@unocss/core';
import config from '../../uno.config.mjs';

// Every .ts file under a folder (layouts and components use class names too).
export function tsFiles(dir) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((f) => f.isFile() && f.name.endsWith('.ts'))
    .map((f) => `${f.parentPath}/${f.name}`);
}

export async function makeCss(files) {
  const uno = await createGenerator(config);
  // UnoCSS finds class names in plain text, so we hand it the files as one string.
  const text = files.map((f) => readFileSync(f, 'utf8')).join('\n');
  const { css } = await uno.generate(text);
  return css;
}
