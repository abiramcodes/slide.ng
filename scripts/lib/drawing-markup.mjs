// The markup of a drawing as the dev server accepts it: only the shapes drauu draws, only the attributes drauu sets, nothing else.
// This is a small strict parser, not a pattern test. The text is read element by element; anything that is not exactly
// `<name attr="value" .../>` or `<name ...>...</name>` with names from the lists below is refused as a whole (comments, processing
// instructions, CDATA, doctypes, text, entities, unquoted values, a missing space between attributes, unknown attributes).
// What is written to disk is built again from what was read, with the values escaped, never the text that came in.
// The browser side does the same with the DOM in src/app/drawing/clean-svg.ts.

const SHAPES = new Set([
  'g', 'defs', 'marker', 'path', 'line', 'rect', 'ellipse', 'circle', 'polygon', 'polyline',
]); // prettier-ignore

const ATTRIBUTES = new Set([
  'd', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'cx', 'cy', 'r', 'rx', 'ry', 'points',
  'transform', 'id', 'viewBox', 'fill', 'fill-opacity', 'fill-rule', 'opacity', 'stroke',
  'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap',
  'stroke-linejoin', 'stroke-miterlimit', 'marker-start', 'marker-mid', 'marker-end',
  'markerWidth', 'markerHeight', 'markerUnits', 'refX', 'refY', 'orient', 'data-drauu_index',
]); // prettier-ignore

const MAX_DEPTH = 12;
const MAX_ELEMENTS = 20_000;
const NAME = /[A-Za-z][A-Za-z0-9]*/y;
const ATTR_NAME = /[A-Za-z][A-Za-z0-9_-]*/y;
const SPACE = /[ \t\r\n]+/y;

// A value: no markup characters, no entities, and a url() only as a reference to an id in the same drawing.
function valueOk(value) {
  // eslint-disable-next-line no-control-regex -- control characters in a value are refused on purpose
  if (/[<>&\\\u0000-\u0008\u000b-\u001f\u007f]/.test(value)) return false;
  if (/javascript:|data:|expression\s*\(|@import/i.test(value)) return false;
  for (const m of value.matchAll(/url\(([^)]*)\)/gi))
    if (!/^\s*#[\w-]+\s*$/.test(m[1])) return false;
  return !/url\s*\((?![^)]*\))/i.test(value);
}

const escapeAttr = (v) => v.replace(/"/g, '&quot;');

/**
 * The cleaned markup, or null when the text is not a drawing made of the allowed shapes.
 * @param {unknown} markup
 * @param {number} [limit] the longest text accepted
 * @returns {string | null}
 */
export function cleanDrawing(markup, limit = 500_000) {
  if (typeof markup !== 'string' || markup.length > limit) return null;
  let pos = 0;
  let count = 0;
  const out = [];

  // Moves over white space; true when there was some.
  const skipSpace = () => {
    SPACE.lastIndex = pos;
    if (!SPACE.test(markup)) return false;
    pos = SPACE.lastIndex;
    return true;
  };
  const word = (re) => {
    re.lastIndex = pos;
    const m = re.exec(markup);
    if (!m) return null;
    pos = re.lastIndex;
    return m[0];
  };

  // Reads one element starting at `<`. Returns false when the text is not acceptable.
  function element(depth) {
    if (depth > MAX_DEPTH || ++count > MAX_ELEMENTS) return false;
    pos++; // <
    const name = word(NAME);
    if (!name || !SHAPES.has(name.toLowerCase())) return false;
    const tag = name.toLowerCase();
    const attrs = [];
    const seen = new Set();
    for (;;) {
      const hadSpace = skipSpace();
      if (markup.startsWith('/>', pos)) {
        pos += 2;
        out.push(`<${tag}${attrs.join('')}/>`);
        return true;
      }
      if (markup[pos] === '>') {
        pos++;
        break;
      }
      if (!hadSpace) return false; // `<path d="x"onclick=...` or `<path/onclick=...`
      const attr = word(ATTR_NAME);
      if (!attr || !ATTRIBUTES.has(attr) || seen.has(attr)) return false;
      seen.add(attr);
      skipSpace();
      if (markup[pos++] !== '=') return false;
      skipSpace();
      const quote = markup[pos++];
      if (quote !== '"' && quote !== "'") return false;
      const end = markup.indexOf(quote, pos);
      if (end < 0) return false;
      const value = markup.slice(pos, end);
      pos = end + 1;
      if (!valueOk(value)) return false;
      attrs.push(` ${attr}="${escapeAttr(value)}"`);
    }
    out.push(`<${tag}${attrs.join('')}>`);
    // The content: only elements and white space, up to the closing tag.
    for (;;) {
      skipSpace();
      if (pos >= markup.length) return false;
      if (markup.startsWith('</', pos)) {
        pos += 2;
        const closing = word(NAME);
        skipSpace();
        if (closing?.toLowerCase() !== tag || markup[pos++] !== '>') return false;
        out.push(`</${tag}>`);
        return true;
      }
      if (markup[pos] !== '<' || !element(depth + 1)) return false;
    }
  }

  for (;;) {
    skipSpace();
    if (pos >= markup.length) return out.join('');
    if (markup[pos] !== '<' || !element(0)) return null;
  }
}
