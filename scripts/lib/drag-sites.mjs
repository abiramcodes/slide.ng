// The v-drag elements of a slide's markdown. Two readers need to agree on which one is "number 3":
//   - the generator, which tags each one with `drag-site="3"`, so the browser can say which one moved;
//   - the dev server, which finds number 3 in slides.md and writes the new position into it.
// Both call `findDragSites` on the same text, so the numbers always match.

// Code is not markup: blank out fences and inline code (keeping every offset the same).
export function maskCode(md) {
  const blank = (s) => s.replace(/[^\n]/g, ' ');
  return md
    .replace(/^(`{3,})[^\n]*\n[\s\S]*?^\1[ \t]*$/gm, blank)
    .replace(/(`+)(?!`)[^\n]+?\1/g, blank);
}

// <tag attributes> where the attributes may hold quoted `>` characters.
const TAG = /<([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^<>"'])*)>/g;
const COMPONENT = /^v-?drag(-arrow)?$/i;
const DIRECTIVE = /(?<![\w-])v-drag(?![\w-])/;

// The place of a site is written as `v-drag="..."` (on any tag) or `pos="..."` (on the components).
const VALUE = /(?<![\w-])(?:v-drag|pos)=(?:"([^"]*)"|'([^']*)')/;
const NAME = /^[A-Za-z_][\w-]*$/;

/** @returns {{ index: number, start: number, end: number, tag: string, attrs: string, component: boolean, name: string | null }[]}
 *  `name` is set when the place is a name (`v-drag="square"`): its numbers live in the frontmatter, under `dragPos`. */
export function findDragSites(content) {
  const sites = [];
  for (const m of maskCode(content).matchAll(TAG)) {
    const component = COMPONENT.test(m[1]);
    if (component || DIRECTIVE.test(m[2])) {
      const value = VALUE.exec(m[2]);
      const text = (value?.[1] ?? value?.[2] ?? '').trim();
      sites.push({ index: sites.length, start: m.index, end: m.index + m[0].length, tag: m[1], attrs: m[2], component, name: NAME.test(text) ? text : null });
    }
  }
  return sites;
}

/** The content with ` drag-site="N"` added to every v-drag tag (what the generator feeds to the template). */
export function tagDragSites(content) {
  let out = content;
  for (const s of findDragSites(content).reverse()) {
    const at = s.start + 1 + s.tag.length;
    out = `${out.slice(0, at)} drag-site="${s.index}"${out.slice(at)}`;
  }
  return out;
}

// The position text that may be written into markdown: 3 to 5 numbers, `NaN` or `_` (automatic height), in the forms
// `10,20,30,40,5` and `[10,20,30,NaN]`. Nothing else, so a request cannot put markup into the file.
const NUMBER = '(?:-?\\d+(?:\\.\\d+)?|NaN|_)';
const POSITION = new RegExp(`^(?:\\[${NUMBER}(?:,${NUMBER}){2,4}\\]|${NUMBER}(?:,${NUMBER}){2,4})$`);
export const isPosition = (text) => typeof text === 'string' && POSITION.test(text);

/** `10,20,30,_,5` -> `[10,20,30,NaN,5]`: the spelling of `v-drag="..."`. Text that is already an array stays. */
export const toArrayStyle = (pos) => (pos.startsWith('[') ? pos : `[${pos.replace(/_/g, 'NaN')}]`);
/** `[10,20,30,NaN]` -> `10,20,30,_`: the spelling of `pos="..."` and of `dragPos` in the frontmatter. */
export const toPlainStyle = (pos) => pos.replace(/^\[|\]$/g, '').replace(/NaN/g, '_');

/**
 * Write `pos` into drag site number `site` of a slide's markdown. Returns the new content, or null when there is no such
 * site, the position is not numbers, or the site uses a name (then the frontmatter holds the place: see `dragName`).
 */
export function setDragPosition(content, site, pos) {
  const s = findDragSites(content)[site];
  if (!s || s.name || !isPosition(pos)) return null;
  const tag = content.slice(s.start, s.end);
  let next;
  if (s.component) {
    const plain = `"${toPlainStyle(pos)}"`;
    // <v-drag pos="..."> : replace the pos attribute, or add one
    next = /(\spos=)("[^"]*"|'[^']*')/.test(tag)
      ? tag.replace(/(\spos=)("[^"]*"|'[^']*')/, `$1${plain}`)
      : tag.replace(/^<[\w-]+/, (open) => `${open} pos=${plain}`);
  } else {
    // <img v-drag="..."> or a bare v-drag
    next = tag.replace(/(?<![\w-])v-drag(?:=("[^"]*"|'[^']*'))?(?![\w-])/, `v-drag="${toArrayStyle(pos)}"`);
  }
  return content.slice(0, s.start) + next + content.slice(s.end);
}

/** The frontmatter name of site number `site` (`dragPos: { name: ... }`), or null when its place is written in the markdown. */
export const dragName = (content, site) => findDragSites(content)[site]?.name ?? null;
