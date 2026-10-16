// The `fonts` option of the headmatter, as in Slidev (`resolveFonts` in packages/parser/src/config.ts, docs/custom/config-fonts.md):
// sans, serif and mono names, local fonts, weights, italic, the provider and the fallback fonts.
// Web fonts come from Google Fonts (or coolLabs) with an @import; `provider: none` loads nothing.

const FALLBACKS = {
  sans: [
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    '"Noto Sans"',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
    '"Noto Color Emoji"',
  ],
  serif: ['ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
  mono: [
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    '"Liberation Mono"',
    '"Courier New"',
    'monospace',
  ],
};

const PROVIDERS = {
  google: 'https://fonts.googleapis.com/css2',
  coollabs: 'https://api.fonts.coollabs.io/css2',
};
// Addresses on these hosts are the known providers; any other address needs `fonts.allowCustomProvider: true`, because the
// style sheet from the provider ends up in the deck's CSS and its font files are downloaded at build time.
const KNOWN_HOSTS = new Set(['https://fonts.googleapis.com', 'https://api.fonts.coollabs.io']);

/** A text as a CSS string: backslash, quotes and line breaks escaped, so it cannot end the string or the rule. */
export const cssString = (text) =>
  String(text).replace(/[\\"\n\r\f]/g, (c) => `\\${c.charCodeAt(0).toString(16)} `);

// A string or a list of strings, cut at the commas.
const names = (value) =>
  []
    .concat(value ?? [])
    .flatMap((v) => String(v).split(','))
    .map((v) => v.trim())
    .filter(Boolean);
const uniq = (list) => [...new Set(list)];
const quoted = (font) => (/^(['"]).*\1$/.test(font) ? font : `"${font}"`);

function providerBase(provider, allowCustomProvider) {
  if (PROVIDERS[provider]) return PROVIDERS[provider];
  if (!/^https?:\/\/\S+$/.test(String(provider))) return null; // `none`, or something that is not an address
  let url;
  try {
    url = new URL(String(provider));
  } catch {
    throw new Error(`fonts.provider "${provider}" is not a valid address`);
  }
  if (url.username || url.password)
    throw new Error('fonts.provider must not contain a user name or password');
  if (!(KNOWN_HOSTS.has(url.origin) || allowCustomProvider === true))
    throw new Error(
      `fonts.provider "${provider}" is not a known font provider (google, coollabs). Set fonts.allowCustomProvider: true in the headmatter to use it`,
    );
  return url.href.replace(/[?#].*$/, '');
}

/** The font lists of the headmatter, with the fallbacks added and the names that must be loaded from the provider. */
export function resolveFonts(fonts = {}) {
  const {
    fallbacks = true,
    italic = false,
    provider = 'google',
    allowCustomProvider = false,
  } = fonts;
  const sans = names(fonts.sans);
  const serif = names(fonts.serif);
  const mono = names(fonts.mono);
  const local = names(fonts.local);
  const custom = names(fonts.custom);
  const weights = names(fonts.weights || '200,400,600');
  // Names that are only the generic families are not web fonts.
  const generic = new Set(
    [...FALLBACKS.sans, ...FALLBACKS.serif, ...FALLBACKS.mono].map((f) => f.replace(/"/g, '')),
  );
  const webfonts = fonts.webfonts
    ? names(fonts.webfonts)
    : fallbacks
      ? uniq([...sans, ...serif, ...mono, ...custom]).filter(
          (f) => !local.includes(f) && !generic.has(f),
        )
      : [];
  const withFallbacks = (list, extra) =>
    fallbacks ? uniq([...list.map(quoted), ...extra]) : list.map(quoted);
  return {
    sans: withFallbacks(sans, FALLBACKS.sans),
    serif: withFallbacks(serif, FALLBACKS.serif),
    mono: withFallbacks(mono, FALLBACKS.mono),
    webfonts,
    provider,
    allowCustomProvider: allowCustomProvider === true,
    local,
    italic,
    weights,
  };
}

/**
 * The address of the style sheet that loads the web fonts, or null. `provider` is `google`, `coollabs`, `none`, or the address of a
 * Google-compatible `css2` endpoint (a mirror inside a company, or a test server). An address that is not on a known host
 * is refused with an error unless the deck sets `fonts.allowCustomProvider: true`.
 */
export function fontsUrl({ webfonts, provider, italic, weights, allowCustomProvider }) {
  const base = providerBase(provider, allowCustomProvider);
  if (!base || !webfonts.length) return null;
  const axis = italic
    ? `ital,wght@${[0, 1].flatMap((i) => weights.map((w) => `${i},${w}`)).join(';')}`
    : `wght@${weights.join(';')}`;
  const families = webfonts.map(
    (f) =>
      `family=${encodeURIComponent(f.replace(/^(['"])(.*)\1$/, '$2')).replace(/%20/g, '+')}:${axis}`,
  );
  return `${base}?${families.join('&')}&display=swap`;
}

/**
 * The CSS for the deck's `fonts` (empty without it, so a deck that does not set fonts looks as before).
 * The classes `font-sans`, `font-serif` and `font-mono` use the lists, the page text uses `sans`, code uses `mono`.
 * `faces` is the provider's style sheet with the font files already downloaded (see font-bundle.mjs); it replaces the @import.
 * @param {Record<string, any>} headmatter
 * @param {string | null} [faces]
 */
export function fontsCss(headmatter, faces = null) {
  if (!headmatter.fonts || typeof headmatter.fonts !== 'object') return '';
  const fonts = resolveFonts(headmatter.fonts);
  const url = fontsUrl(fonts);
  const lines = [];
  if (faces) lines.push(faces.trim());
  else if (url) lines.push(`@import url("${cssString(url)}");`);
  lines.push(
    `:root { --slidev-font-sans: ${fonts.sans.join(',')}; --slidev-font-serif: ${fonts.serif.join(',')}; --slidev-font-mono: ${fonts.mono.join(',')}; --slidev-code-font-family: var(--slidev-font-mono); }`,
  );
  lines.push('html, body { font-family: var(--slidev-font-sans); }');
  lines.push(':root .font-sans { font-family: var(--slidev-font-sans); }');
  lines.push(':root .font-serif { font-family: var(--slidev-font-serif); }');
  lines.push(':root .font-mono { font-family: var(--slidev-font-mono); }');
  return lines.join('\n') + '\n';
}
