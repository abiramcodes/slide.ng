// Reads what follows the language on a code fence, in Slidev's syntax:
//   ```ts [title] {2,3|5|all} {lines:true,maxHeight:'100px'}
// The ranges and the options are two separate braces, as in Slidev.
const INFO = /^([\w'#+-]+)?(?:[ \t]*|[ \t][ \w\t'-]*)(?:\[([^\]]*)\])?[ \t]*(?:\{([\w,|\-*]+)\})?[ \t]*(\{[^}]*\})?(.*)$/;

// "{lines:true, maxHeight:'100px'}" -> { lines: true, maxHeight: '100px' }
// Only simple values: true, false, numbers, quoted text, or a bare word (height:200px).
export function parseOptions(text = '') {
  const out = {};
  for (const [, key, raw] of text.matchAll(/([\w$-]+)\s*:\s*('[^']*'|"[^"]*"|[^,}]+)/g)) {
    const v = raw.trim();
    if (v === 'true' || v === 'false') out[key] = v === 'true';
    else if (v !== '' && !isNaN(+v)) out[key] = +v;
    else out[key] = v.replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}

// "2-3|5|all" -> ["2-3", "5", "all"]; no ranges -> []
export const splitRanges = (text = '') => (text.trim() ? text.trim().split('|').map((s) => s.trim()) : []);

export function parseInfo(info) {
  const [, lang = '', title = '', rangeStr = '', optionText = '', rest = ''] = INFO.exec(info.trim()) ?? [];
  return { lang, title, ranges: splitRanges(rangeStr), options: parseOptions(optionText), rest: rest.trim() };
}

// The title bar text: Slidev lets a title carry an icon as ~icon-name~, which we do not draw.
export const cleanTitle = (title) => title.replace(/~([^~]+)~/g, '').trim();

// "{monaco}", "{monaco-diff}", "{monaco-run}" right after the language.
const MONACO = /^([\w'-]+)?\s*\{(monaco[\w-]*)\}\s*(\{[^}]*\})?(.*)$/;
export function parseMonacoInfo(info) {
  const m = MONACO.exec(info.trim());
  return m ? { lang: m[1] ?? '', kind: m[2], options: parseOptions(m[3]) } : null;
}
