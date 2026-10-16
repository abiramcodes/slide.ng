// Roots: the folders a deck gets its look from. In this order, later ones win:
//   the built-in theme (src/app, always there)  <  `theme:`  <  each of `addons:`  <  the deck's own folder
// A theme or addon is a folder (or a package from node_modules) with any of these inside (see docs/THEMES.md):
//   layouts/  components/  layers/  styles/  public/  setup/  uno.config.mjs  theme.json
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';

/** What a theme can bring, as folders. `public` is merged, the others are copied under their root. */
export const ROOT_FOLDERS = ['layouts', 'components', 'layers', 'styles', 'public', 'setup'];

const isDir = (path) => existsSync(path) && statSync(path).isDirectory();

/** Folders named like `./theme` or `/abs/theme` are paths; anything else is a package name. */
const isPath = (spec) => spec.startsWith('.') || isAbsolute(spec);

/**
 * Finds the folder of a theme or addon. `kind` is `theme` or `addon`: a package called `ocean` is looked for as
 * `slide-ng-theme-ocean` and then as `ocean`, in the `node_modules` folders from the deck's folder upwards.
 */
export function findRootDir(spec, kind, deckRoot) {
  if (typeof spec !== 'string' || !spec.trim()) throw new Error(`${kind}: expected a name or a path, got ${JSON.stringify(spec)}`);
  if (isPath(spec)) {
    const dir = resolve(deckRoot, spec);
    if (!isDir(dir)) throw new Error(`${kind} "${spec}" is not a folder (looked for ${dir})`);
    return realpathSync(dir);
  }
  const names = spec.startsWith('slide-ng-') ? [spec] : [`slide-ng-${kind}-${spec}`, spec];
  for (let dir = resolve(deckRoot); ; dir = dirname(dir)) {
    for (const name of names) if (isDir(join(dir, 'node_modules', name))) return realpathSync(join(dir, 'node_modules', name));
    if (dirname(dir) === dir) break;
  }
  throw new Error(`${kind} "${spec}" was not found. Install it (npm i -D ${names[0]}) or use a path such as ./${spec}`);
}

/**
 * theme.json of a root: `{ name, headmatter, layouts }`, with anything unusable left out. Missing file = empty.
 * @returns {{ name?: string, headmatter: any, layouts: Record<string, { props: string[], slots: string[], classProp: boolean }> }}
 */
export function readManifest(dir) {
  const file = join(dir, 'theme.json');
  if (!existsSync(file)) return { headmatter: {}, layouts: {} };
  let data;
  try { data = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { throw new Error(`${file} is not valid JSON (${e.message})`); }
  const object = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  const layouts = Object.fromEntries(Object.entries(object(data.layouts)).map(([name, l]) => [name, {
    props: Array.isArray(l?.props) ? l.props.filter((p) => /^[A-Za-z][\w-]*$/.test(p)) : [],
    slots: Array.isArray(l?.slots) ? l.slots.filter((s) => /^[A-Za-z][\w-]*$/.test(s)) : [],
    classProp: Boolean(l?.classProp),
  }]));
  return { name: typeof data.name === 'string' ? data.name : undefined, headmatter: object(data.headmatter), layouts };
}

const safeId = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'root';

/**
 * The roots of a deck, in order: theme, addons, deck. Built-in theme is not listed (it is the base everything sits on).
 * `themeOverride` is the `--theme` flag. `theme: default` (or `none`) means no extra theme.
 * A theme that is a package name and is not installed is reported with `warn` and the built-in theme is used, so a deck written
 * for a community theme still runs. A path that is not a folder is an error.
 * @param {{ deckRoot: string, headmatter: any, themeOverride?: string, warn?: (message: string) => void }} options
 */
export function resolveRoots({ deckRoot, headmatter, themeOverride, warn = () => {} }) {
  const roots = [];
  const theme = themeOverride ?? headmatter.theme;
  if (theme && theme !== 'default' && theme !== 'none') {
    try {
      const dir = findRootDir(theme, 'theme', deckRoot);
      roots.push({ id: `theme-${safeId(theme)}`, kind: 'theme', spec: theme, dir, manifest: readManifest(dir) });
    } catch (e) {
      if (isPath(String(theme))) throw e;
      warn(`${e.message}. Using the built-in theme.`);
    }
  }
  const addons = Array.isArray(headmatter.addons) ? headmatter.addons : [];
  addons.forEach((spec, i) => {
    const dir = findRootDir(spec, 'addon', deckRoot);
    roots.push({ id: `addon-${i + 1}-${safeId(spec)}`, kind: 'addon', spec, dir, manifest: readManifest(dir) });
  });
  roots.push({ id: 'deck', kind: 'deck', spec: '.', dir: resolve(deckRoot), manifest: { headmatter: {}, layouts: {} } });
  return roots;
}

/** The headmatter with the themes' defaults underneath it. `defaults` (per-slide defaults) are merged key by key. */
export function mergeHeadmatter(roots, headmatter) {
  const merged = {};
  let defaults = {};
  for (const source of [...roots.map((r) => r.manifest.headmatter), headmatter]) {
    const { defaults: d, ...rest } = source;
    Object.assign(merged, rest);
    defaults = { ...defaults, ...(d && typeof d === 'object' ? d : {}) };
  }
  if (Object.keys(defaults).length) merged.defaults = defaults;
  return merged;
}
