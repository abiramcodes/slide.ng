// Finds the code fences in a slide's markdown and sets them aside, so the markdown
// converter never sees them. Also expands `<<< file` snippet lines and `::code-group` blocks,
// which are made of fences. Each one is replaced by a line `NGFENCE<n>X`.
import { SNIPPET_LINE, resolveSnippet } from './code/snippet.mjs';

const OPEN = /^(`{3,})(.*)$/;
const CLOSE = /^(`{3,})[ \t]*$/;
const GROUP_OPEN = /^:{2,}code-group[ \t]*$/;
const GROUP_CLOSE = /^:{2,}[ \t]*$/;

// ctx: { file, root } say where `<<<` paths start from.
export function extractFences(markdown, ctx = {}) {
  const fences = [];
  const out = [];
  let open = null; // the fence being read: { ticks, info, lines }
  let group = null; // the code group being read: its fences so far

  const finish = (fence) => {
    if (group) group.push(fence);
    else out.push(`\nNGFENCE${fences.push(fence) - 1}X\n`);
  };

  for (const line of markdown.replace(/\r/g, '').split('\n')) {
    if (open) {
      const close = CLOSE.exec(line);
      if (close && close[1].length >= open.ticks) {
        finish({ ticks: open.ticks, info: open.info, code: open.lines.join('\n') });
        open = null;
      } else open.lines.push(line);
    } else if (OPEN.test(line)) {
      const [, ticks, info] = OPEN.exec(line);
      open = { ticks: ticks.length, info: info.trim(), lines: [] };
    } else if (SNIPPET_LINE.test(line)) {
      const snippet = resolveSafe(line, ctx);
      if (snippet) finish({ ticks: 3, info: `${snippet.lang} ${snippet.meta}`.trim(), code: snippet.code, file: snippet.path, partial: snippet.partial });
    } else if (!group && GROUP_OPEN.test(line)) {
      group = [];
    } else if (group && GROUP_CLOSE.test(line)) {
      out.push(`\nNGFENCE${fences.push({ group }) - 1}X\n`);
      group = null;
    } else if (!group) out.push(line); // text between the fences of a group is dropped
  }
  // An unclosed fence or group keeps what was read, as markdown does.
  if (open) finish({ ticks: open.ticks, info: open.info, code: open.lines.join('\n') });
  if (group) out.push(`\nNGFENCE${fences.push({ group }) - 1}X\n`);
  return { markdown: out.join('\n'), fences };
}

// A missing file becomes a visible code block and a warning, not a crash.
function resolveSafe(line, ctx) {
  try {
    return resolveSnippet(line, ctx.file ?? 'slides.md', ctx.root ?? '.');
  } catch (e) {
    console.warn(`[slides] ${e.message}`);
    return { code: `// ${e.message}`, lang: 'text', meta: '' };
  }
}
