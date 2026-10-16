// A normal code fence -> highlighted HTML inside a <code-block-wrapper> component.
// The wrapper (src/app/code/code-block-wrapper.ts) adds the copy button, the title bar, the
// click-stepped line highlights and the maximum height.
import { codeToHtml } from './highlighter.mjs';
import { cleanTitle, parseInfo } from './meta.mjs';
import { attrs, protect } from '../protect.mjs';

// Shiki's <pre>, made safe for Angular: ngNonBindable and no `{` `}` `@` left in the text.
export function highlightedPre(code, lang) {
  const html = codeToHtml(code, lang, {
    transformers: [{
      pre(node) {
        this.addClassToHast(node, 'slidev-code');
        delete node.properties.tabindex;
      },
    }],
  });
  return protect(html).replace('<pre ', '<pre ngNonBindable ');
}

// `ctx.headmatter` gives the deck-wide defaults (`lineNumbers`, `codeCopy`).
export function renderCode(fence, ctx = {}) {
  const { lang, title, ranges, options } = parseInfo(fence.info);
  const head = ctx.headmatter ?? {};
  const wrapperAttrs = attrs({
    ranges: ranges.join('|'),
    title: cleanTitle(title),
    lines: options.lines ?? head.lineNumbers,
    startLine: options.startLine,
    maxHeight: options.maxHeight,
    at: options.at,
    finally: options.finally,
    noCopy: (head.codeCopy ?? true) === false || undefined,
  });
  return `<code-block-wrapper${wrapperAttrs}>${highlightedPre(fence.code, lang)}</code-block-wrapper>`;
}
