// Turns the markdown of ONE slide into an Angular template string.
//
// The hard part: markdown converters mangle Angular syntax (`@if (x) {`,
// `[prop]="v"`, `{{ x }}`). So we hide that syntax behind placeholders,
// run the markdown converter, then put the syntax back untouched.
import { marked } from 'marked';

// In normal text Angular would read `{`, `}` and `@` as syntax.
// Writing them as HTML entities makes them plain characters.
export const protect = (s) =>
  s.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;').replace(/@/g, '&#64;');

// (Angular still reads `{{` after entities are decoded, so code also gets ngNonBindable.)
// Same, plus the characters that are special in HTML (for code blocks).
export const escapeCode = (s) =>
  protect(s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));

// A tag that uses Angular syntax: [x]="..", (x)="..", *x, #x or @x on it.
const ANGULAR_TAG = '<[a-z][\\w-]*\\s[^>\\n]*[\\[(*#@][^>\\n]*>';

export function toTemplate(markdown) {
  const kept = []; // Angular syntax we put back at the end
  const keep = (s) => `NGKEEP${kept.push(s) - 1}X`;
  // A line that is only an HTML comment is left alone by the markdown converter.
  const hide = (s) => `<!--${keep(s)}-->`;

  // 1. Code fences and inline code are plain text: set them aside first.
  const fences = [];
  let md = markdown.replace(/\r/g, '').replace(/^```.*\n[\s\S]*?^```$/gm, (m) => {
    fences.push(m);
    return `\nNGFENCE${fences.length - 1}X\n`;
  });
  const inlines = [];
  md = md.replace(/(`+)(.+?)\1/g, (_, __, code) => `NGCODE${inlines.push(code) - 1}X`);

  // 2. Hide Angular syntax.
  md = md.replace(/^[ \t]*(\}[ \t]*)?(@\w+.*\{|\})[ \t]*$/gm, hide); // @if (..) {   }   } @else {
  md = md.replace(/^[ \t]*@let\s.*;[ \t]*$/gm, hide); // @let x = 1;
  md = md.replace(new RegExp(`^[ \\t]*${ANGULAR_TAG}[ \\t]*$`, 'gm'), hide); // tag alone on a line
  md = md.replace(new RegExp(`^([ \\t]*)(${ANGULAR_TAG})(?=[ \\t]*\\S)`, 'gm'), (_, ws, tag) => ws + hide(tag));
  md = md.replace(new RegExp(ANGULAR_TAG, 'g'), keep); // tag inside a paragraph
  md = md.replace(/\{\{[\s\S]*?\}\}/g, keep); // {{ interpolation }}

  // 3. Markdown -> HTML, then make the remaining braces and @ harmless.
  let html = protect(marked.parse(md, { async: false }));

  // 4. Put everything back.
  html = html.replace(/<p>NGFENCE(\d+)X<\/p>/g, (_, i) => {
    const [, lang, code] = /^```(\w*).*\n([\s\S]*?)\n```$/m.exec(fences[+i]);
    return `<pre ngNonBindable><code class="language-${lang}">${escapeCode(code)}</code></pre>`;
  });
  html = html.replace(/NGCODE(\d+)X/g, (_, i) => `<code ngNonBindable>${escapeCode(inlines[+i])}</code>`);
  return html.replace(/<!--NGKEEP(\d+)X-->/g, (_, i) => kept[+i]).replace(/NGKEEP(\d+)X/g, (_, i) => kept[+i]);
}
