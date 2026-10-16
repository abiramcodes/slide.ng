// Loads one setup file (docs/SETUP.md). A setup file is plain TypeScript (or JavaScript) that default-exports a function.
// Node cannot read TypeScript inside `node_modules` (where a theme package lives), so the file is bundled with esbuild first:
//   - types are removed, and the files it imports by a relative path are put in;
//   - packages it imports are NOT put in: each one is found from the setup file's own folder (a deck's `node_modules`, a theme's)
//     and imported by its full path, so a theme can use its own dependencies;
//   - `import.meta.url` (and `dirname`, `filename`) say where the setup file really is, although the bundle is run from a temporary folder.
import { builtinModules } from 'node:module';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Packages are left out of the bundle and found from the folder of the file that imports them.
const packagesFromHere = {
  name: 'packages-from-the-importing-folder',
  setup(b) {
    b.onResolve({ filter: /.*/ }, async (args) => {
      if (args.pluginData?.inner || args.kind === 'entry-point') return undefined;
      if (args.path.startsWith('.') || isAbsolute(args.path)) return undefined;
      if (args.path.startsWith('node:') || builtinModules.includes(args.path)) return { path: args.path, external: true };
      const found = await b.resolve(args.path, { resolveDir: args.resolveDir, kind: args.kind, pluginData: { inner: true } });
      if (found.errors.length) return { errors: found.errors.map((e) => ({ ...e, text: `${e.text} (imported by ${args.importer})` })) };
      return { path: pathToFileURL(found.path).href, external: true };
    });
  },
};

/** The default export of a setup file. A file that does not default-export a function is an error. */
export async function loadSetupFunction(file) {
  let code;
  try {
    const { build } = await import('esbuild'); // only loaded when a setup file exists
    const result = await build({
      entryPoints: [file], bundle: true, write: false, format: 'esm', platform: 'node', target: 'node22', logLevel: 'silent',
      plugins: [packagesFromHere],
      define: {
        'import.meta.url': JSON.stringify(pathToFileURL(file).href),
        'import.meta.dirname': JSON.stringify(dirname(file)),
        'import.meta.filename': JSON.stringify(file),
      },
    });
    code = result.outputFiles[0].text;
  } catch (e) {
    throw new Error(`${file} could not be read: ${e.errors?.[0]?.text ?? e.message}`);
  }
  const dir = mkdtempSync(join(tmpdir(), 'slide-ng-setup-'));
  try {
    const out = join(dir, `${basename(file).replace(/\.\w+$/, '')}.mjs`);
    writeFileSync(out, code);
    const mod = await import(pathToFileURL(out).href);
    if (typeof mod.default !== 'function') throw new Error(`${file} must export a function by default (export default ...)`);
    return mod.default;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
