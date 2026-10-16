// `slide-ng build --offline`: turns a finished build into a folder that also works when index.html is opened straight
// from disk (file://) and when the folder is copied to a USB stick.
//
// Two things stop a normal build from running there:
//   1. Chromium refuses `<script type="module">` and `import()` of files over file:// (the page's origin is "null", so the
//      request counts as cross-origin). We bundle the app and all its lazy chunks into one classic script instead.
//   2. Addresses that start with `/` point at the root of the disk. There is no <base>, and the slide lives after a `#`.
// Workers (Monaco) are a third case, see offline-workers.mjs.
import { build } from 'esbuild';
import { readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { WORKER_SHIM, workerFiles, workersScript } from './offline-workers.mjs';

const MODULE_SCRIPT =
  /<script\b[^>]*\bsrc="([^"]+)"[^>]*\btype="module"[^>]*><\/script>|<script\b[^>]*\btype="module"[^>]*\bsrc="([^"]+)"[^>]*><\/script>/i;

/** The page rewritten for classic scripts: no <base>, no module scripts or preloads. Returns `{ html, entry }`. */
export function classicPage(html, { workers = false } = {}) {
  const match = MODULE_SCRIPT.exec(html);
  if (!match)
    throw new Error(
      'the build has no module script in index.html, cannot make it work from a folder',
    );
  const entry = match[1] ?? match[2];
  // `workers.js` comes first, so the app finds the stored worker sources when it starts one.
  const scripts = `${workers ? '<script defer src="workers.js"></script>' : ''}<script defer src="${entry}"></script>`;
  const page = html
    // With a <base>, `#/3` would point at the folder instead of at index.html.
    .replace(/<base\b[^>]*>\s*/gi, '')
    .replace(/<link rel="modulepreload"[^>]*>/gi, '')
    .replace(MODULE_SCRIPT, () => scripts);
  return { html: page, entry };
}

// One classic script from `file` and everything it imports, lazily or not. `inputs` are the files that went in.
async function bundleClassic(file, { banner = '', url }) {
  const result = await build({
    entryPoints: [file],
    bundle: true,
    write: false,
    format: 'iife',
    target: 'es2022',
    metafile: true,
    logLevel: 'silent',
    banner: { js: banner },
    define: { 'import.meta.url': url },
  });
  return {
    text: result.outputFiles[0].text,
    inputs: Object.keys(result.metafile.inputs).map((p) => resolve(p)),
  };
}

/**
 * Rewrites the build in `dir` in place. Returns `{ entry, removed, workers }`: the script that now holds the whole app,
 * the number of files folded into it, and the worker files that were stored in `workers.js`.
 */
export async function makeOffline(dir) {
  const real = realpathSync(dir); // the bundler reports real paths
  const page = readFileSync(join(real, 'index.html'), 'utf8');
  const entry = classicPage(page).entry;
  const entryFile = resolve(real, entry);

  // A classic script has no `import.meta.url`; the address of the script itself stands in for it.
  const app = await bundleClassic(entryFile, {
    banner: 'var __slideNgScriptUrl = document.currentScript && document.currentScript.src;',
    url: '__slideNgScriptUrl',
  });
  const workers = workerFiles(app.text);
  const sources = {};
  const used = new Set(app.inputs);
  for (const name of workers) {
    const bundle = await bundleClassic(join(real, name), { url: 'self.location.href' });
    sources[name] = bundle.text;
    [join(real, name), ...bundle.inputs].forEach((f) => used.add(f));
  }

  writeFileSync(entryFile, (workers.length ? WORKER_SHIM : '') + app.text);
  if (workers.length) writeFileSync(join(real, 'workers.js'), workersScript(sources));
  const folded = [...used].filter((f) => f !== entryFile && f.startsWith(real + sep));
  for (const file of folded) rmSync(file, { force: true });
  writeFileSync(join(real, 'index.html'), classicPage(page, { workers: workers.length > 0 }).html);
  return { entry: relative(real, entryFile), removed: folded.length, workers };
}
