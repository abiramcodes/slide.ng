// Speaker notes -> HTML for the presenter page. `[click]` markers (at the start of a line or
// list item) become spans that the browser uses to highlight the part for the current click:
//   [click]    the next click       [click:3]  skip two clicks (same rule as Slidev's click markers)
// `notesAutoRuby` in the headmatter is a {word: reading} map that wraps each listed word in <ruby>,
// so a presenter reading Japanese or Chinese sees its reading above (Slidev's `notesAutoRuby`).
import { marked } from 'marked';

const RE_ESC = /[.*+?^${}()|[\]\\]/g;
const escapeRe = (s) => s.replace(RE_ESC, '\\$&');
const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
// Skip inside <pre>, <code> (code blocks and code spans) and an existing <ruby> (so its base text
// is not wrapped again), and never touch what is inside an HTML tag (an attribute value is part of the tag).
const SKIP =
  /<pre[\s>][\s\S]*?<\/pre>|<code[\s>][\s\S]*?<\/code>|<ruby[\s>][\s\S]*?<\/ruby>|<[^>]+>/g;

function applyRuby(html, rubyMap) {
  if (!rubyMap || typeof rubyMap !== 'object') return html;
  const entries = Object.entries(rubyMap).filter(([w, r]) => w && typeof r === 'string');
  if (!entries.length) return html;
  entries.sort(([a], [b]) => b.length - a.length);
  const readings = new Map(entries.map(([w, r]) => [w, escapeHtml(r)]));
  const re = new RegExp(entries.map(([w]) => escapeRe(w)).join('|'), 'g');
  const wrap = (text) =>
    text.replace(re, (word) => `<ruby>${word}<rt>${readings.get(word)}</rt></ruby>`);
  let out = '';
  let last = 0;
  for (const m of html.matchAll(SKIP)) {
    out += wrap(html.slice(last, m.index)) + m[0];
    last = m.index + m[0].length;
  }
  return out + wrap(html.slice(last));
}

/**
 * @param {string | null | undefined} note
 * @param {Record<string, string> | null | undefined} [rubyMap]
 * @returns {string | null}
 */
export function noteToHtml(note, rubyMap) {
  if (!note || !note.trim()) return null;
  let clicks = 0;
  const withMarks = note.replace(/\[click(?::(\d+))?\]/gi, (_, n = '1') => {
    clicks += Number(n);
    return `<span class="slidev-note-click-mark" data-clicks="${clicks}"></span>`;
  });
  return applyRuby(marked.parse(withMarks, { async: false }), rubyMap);
}
