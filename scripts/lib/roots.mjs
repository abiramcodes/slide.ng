// Roots: the folders a deck gets its look from. In this order, later ones win:
//   the built-in theme (src/app, always there)  <  `theme:`  <  each of `addons:`  <  the deck's own folder
// A theme or addon is a folder (or a package from node_modules) with any of these inside (see docs/THEMES.md):
//   layouts/  components/  layers/  styles/  public/  setup/  uno.config.mjs  theme.json
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installCommand } from './install-root.mjs';

/** What a theme can bring, as folders. `public` is merged, the others are copied under their root. */
export const ROOT_FOLDERS = ['layouts', 'components', 'layers', 'styles', 'public', 'setup'];

/** The themes that ship with slide.ng (`themes/<name>/`), looked up before `node_modules`. `default` is not one of them: it is the built-in look. */
export const BUILTIN_THEMES_DIR = fileURLToPath(new URL('../../themes', import.meta.url));

const isDir = (path) => existsSync(path) && statSync(path).isDirectory();

/** Folders named like `./theme` or `/abs/theme` are paths; anything else is a package name. */
const isPath = (spec) => spec.startsWith('.') || isAbsolute(spec);

/** A theme or addon package that is not installed. `pkg` is what to install, `command` is the line to run. */
export class RootNotFoundError extends Error {
  constructor(kind, spec, pkg, command) {
    super(`The ${kind} "${spec}" was not found. Install it with: ${command}`);
    this.name = 'RootNotFoundError';
    this.kind = kind;
    this.spec = spec;
    this.pkg = pkg;
    this.command = command;
  }
}

// A scoped package name such as @scope/slide-ng-theme-x (the same rule as Slidev's resolver for the name).
const SAFE_SCOPED = /^@[a-z0-9~-][a-z0-9._~-]*\/[a-z0-9~-][a-z0-9._~-]*$/;
const SAFE_NAME = /^[a-z0-9~-][a-z0-9._~-]*$/;

/**
 * Finds the folder of a theme or addon. `kind` is `theme` or `addon`: a package called `ocean` is looked for as
 * `slide-ng-theme-ocean` and then as `ocean`, in the `node_modules` folders from the deck's folder upwards.
 * Like Slidev: `@/x` is relative to the deck's folder, a name with a slash that does not start with @ is a path,
 * and a package that cannot be found throws a `RootNotFoundError` that carries the install command.
 * A theme name is first looked for in `builtinDir` (the `themes/` folder of slide.ng), then in `node_modules`.
 */
export function findRootDir(spec, kind, deckRoot, builtinDir = BUILTIN_THEMES_DIR) {
  if (typeof spec !== 'string' || !spec.trim()) throw new Error(`${kind}: expected a name or a path, got ${JSON.stringify(spec)}`);
  if (spec.startsWith('@/')) spec = `./${spec.slice(2)}`;
  else if (!spec.startsWith('@') && spec.includes('/') && !isAbsolute(spec)) spec = `./${spec.replace(/^\.\//, '')}`;
  if (isPath(spec)) {
    const dir = resolve(deckRoot, spec);
    if (!isDir(dir)) throw new Error(`${kind} "${spec}" is not a folder (looked for ${dir})`);
    return realpathSync(dir);
  }
  if (!(spec.startsWith('@') ? SAFE_SCOPED : SAFE_NAME).test(spec)) throw new Error(`Invalid ${kind} name "${spec}". Only valid npm package names are allowed.`);
  if (kind === 'theme' && isDir(join(builtinDir, spec))) return realpathSync(join(builtinDir, spec));
  const names = spec.startsWith('slide-ng-') || spec.startsWith('@') ? [spec] : [`slide-ng-${kind}-${spec}`, spec];
  for (let dir = resolve(deckRoot); ; dir = dirname(dir)) {
    for (const name of names) if (isDir(join(dir, 'node_modules', name))) return realpathSync(join(dir, 'node_modules', name));
    if (dirname(dir) === dir) break;
  }
  throw new RootNotFoundError(kind, spec, names[0], installCommand(deckRoot, names[0]).command);
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
 * A theme or addon that is not installed is an error (`RootNotFoundError`, with the install command), like in Slidev.
 * @param {{ deckRoot: string, headmatter: any, themeOverride?: string, builtinDir?: string }} options
 */
export function resolveRoots({ deckRoot, headmatter, themeOverride, builtinDir }) {
  const roots = [];
  const theme = themeOverride ?? headmatter.theme;
  if (theme && theme !== 'default' && theme !== 'none') {
    const dir = findRootDir(theme, 'theme', deckRoot, builtinDir);
    roots.push({ id: `theme-${safeId(theme)}`, kind: 'theme', spec: theme, dir, manifest: readManifest(dir) });
  }
  const addons = Array.isArray(headmatter.addons) ? headmatter.addons : [];
  addons.forEach((spec, i) => {
    const dir = findRootDir(spec, 'addon', deckRoot);
    roots.push({ id: `addon-${i + 1}-${safeId(spec)}`, kind: 'addon', spec, dir, manifest: readManifest(dir) });
  });
  roots.push({ id: 'deck', kind: 'deck', spec: '.', dir: resolve(deckRoot), manifest: { headmatter: {}, layouts: {} } });
  return roots;
}

// Like Slidev, these headmatter objects are merged key by key (a deck that sets `fonts.mono` keeps the theme's `fonts.sans`).
const MERGED_OBJECTS = ['fonts', 'drawings', 'htmlAttrs', 'themeConfig'];
const plain = (v) => v && typeof v === 'object' && !Array.isArray(v);

/** The headmatter with the themes' defaults underneath it. `defaults` (per-slide defaults) and `fonts` are merged key by key. */
export function mergeHeadmatter(roots, headmatter) {
  const merged = {};
  let defaults = {};
  for (const source of [...roots.map((r) => r.manifest.headmatter), headmatter]) {
    const { defaults: d, ...rest } = source;
    for (const key of MERGED_OBJECTS) if (plain(rest[key]) && plain(merged[key])) rest[key] = { ...merged[key], ...rest[key] };
    Object.assign(merged, rest);
    defaults = { ...defaults, ...(d && typeof d === 'object' ? d : {}) };
  }
  if (Object.keys(defaults).length) merged.defaults = defaults;
  return merged;
}
