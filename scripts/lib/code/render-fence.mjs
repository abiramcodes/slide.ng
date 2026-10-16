// Decides what a fence becomes: a code group, a diagram, a magic-move block, an editor or plain highlighted code.
import { renderCode } from './render-code.mjs';

// A `::code-group` is tabs, one per fence; the tab names are the fences' [titles].
function renderGroup(fences, ctx) {
  return `<code-group>${fences.map((f) => renderCode(f, ctx)).join('')}</code-group>`;
}

export function renderFence(fence, ctx) {
  if (fence.group) return renderGroup(fence.group, ctx);
  return renderCode(fence, ctx);
}
