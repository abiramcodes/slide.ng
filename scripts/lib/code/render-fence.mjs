// Decides what a fence becomes: a code group, a diagram, a magic-move block, an editor or plain highlighted code.
import { renderCode } from './render-code.mjs';
import { isMagicMove, renderMagicMove } from './magic-move.mjs';
import { isMonaco, renderMonaco } from './monaco.mjs';
import { isMermaid, isPlantUml, renderMermaid, renderPlantUml } from './diagrams.mjs';

// A `::code-group` is tabs, one per fence; the tab names are the fences' [titles].
function renderGroup(fences, ctx) {
  return `<code-group>${fences.map((f) => renderCode(f, ctx)).join('')}</code-group>`;
}

// `codeblocks` of setup/transformers.ts: the first that returns a string decides what the block becomes (it is template markup).
function transformed(fence, ctx) {
  const [lang = '', ...meta] = fence.info.split(/\s+/);
  const args = { code: fence.code, info: fence.info, lang, meta: meta.join(' '), slide: ctx.slide, options: { data: { headmatter: ctx.headmatter ?? {} } } };
  for (const transform of ctx.codeblocks ?? []) {
    const result = transform(args);
    if (typeof result === 'string') return result;
  }
  return null;
}

export function renderFence(fence, ctx) {
  if (fence.group) return renderGroup(fence.group, ctx);
  const custom = ctx.codeblocks?.length ? transformed(fence, ctx) : null;
  if (custom != null) return custom;
  if (isMonaco(fence)) return renderMonaco(fence, ctx);
  if (isMermaid(fence)) return renderMermaid(fence);
  if (isPlantUml(fence)) return renderPlantUml(fence, ctx);
  if (isMagicMove(fence)) return renderMagicMove(fence, ctx);
  return renderCode(fence, ctx);
}
