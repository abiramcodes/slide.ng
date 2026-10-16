// Making text safe to put inside an Angular template.

// In normal text Angular would read `{`, `}` and `@` as syntax.
// Writing them as HTML entities makes them plain characters.
// (Angular still reads `{{` after entities are decoded, so code and math also get ngNonBindable.)
export const protect = (s) =>
  s.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;').replace(/@/g, '&#64;');

// Same, plus the characters that are special in HTML (for code blocks).
export const escapeCode = (s) =>
  protect(s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));

// Escape a value for use inside a double-quoted HTML attribute.
export const attr = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/[{}@]/g, (c) => `&#${c.charCodeAt(0)};`);

// `name="value"` for each entry that has a value (booleans and numbers are written as text).
export const attrs = (obj) =>
  Object.entries(obj)
    .filter(([, v]) => v != null && v !== '' && v !== false)
    .map(([k, v]) => ` ${k}="${attr(v === true ? 'true' : v)}"`)
    .join('');
