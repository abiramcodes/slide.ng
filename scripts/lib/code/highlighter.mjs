// Shiki, used while generating. The slides come out as finished HTML, so the browser
// never loads a highlighter. Light and dark colours are both written (as CSS variables) and
// the page picks one (see src/styles/code.css), like Slidev's `shiki` setup.
import { bundledLanguages, createHighlighter } from 'shiki';

const DEFAULT_THEMES = { light: 'vitesse-light', dark: 'vitesse-dark' };

// Names that Shiki does not know, mapped to ones it does. A deck can add more (headmatter `codeAliases`).
const BUILTIN_ALIASES = { ng: 'angular-ts', 'ng-html': 'angular-html', txt: 'text', plain: 'text' };

// Shiki draws these without loading a grammar.
const PLAIN = ['text', 'plaintext', 'ansi'];

let highlighter = null;
let aliases = BUILTIN_ALIASES;
let themes = DEFAULT_THEMES;

const resolveAlias = (lang) => aliases[lang] ?? lang;

/** @param {{ langs?: Iterable<string>, headmatter?: any }} [options] */
// Load the themes and the languages the deck uses. Call once before highlighting.
export async function initHighlighter({ langs = [], headmatter = {} } = {}) {
  themes = headmatter.shiki?.themes ?? DEFAULT_THEMES;
  aliases = { ...BUILTIN_ALIASES, ...headmatter.codeAliases };
  const names = [...new Set([...langs, 'ts', 'js', 'html', 'css'].map(resolveAlias))];
  highlighter = await createHighlighter({
    themes: Object.values(themes),
    langs: names.filter((n) => n in bundledLanguages),
  });
}

// The language to draw with, or 'text' (and a warning) when it is not loaded.
function usableLang(lang) {
  const name = resolveAlias(lang || 'text');
  if (PLAIN.includes(name) || highlighter.getLoadedLanguages().includes(name)) return name;
  console.warn(`[slides] code language "${lang}" is not loaded, showing it as plain text`);
  return 'text';
}

export const themeOptions = () => ({ themes, defaultColor: false });

// A finished <pre class="shiki ..."> for the code.
export function codeToHtml(code, lang, extra = {}) {
  return highlighter.codeToHtml(code, { lang: usableLang(lang), ...themeOptions(), ...extra });
}

// Tokens, for Shiki Magic Move.
export function codeToTokens(code, lang) {
  return highlighter.codeToTokens(code, { lang: usableLang(lang), ...themeOptions() });
}
