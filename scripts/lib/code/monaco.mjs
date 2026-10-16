// ```ts {monaco}, {monaco-diff} and {monaco-run} -> <monaco> editor component (src/app/code/monaco-editor.ts).
// The code travels packed, because code is full of braces and quotes.
import { parseMonacoInfo } from './meta.mjs';
import { attrs } from '../protect.mjs';
import { pack } from '../pack.mjs';

export const isMonaco = (fence) => parseMonacoInfo(fence.info) !== null;

// Original and modified text of a diff are separated by a line with `~~~`.
const DIFF_SEPARATOR = /^\s*~~~\s*\n/m;

export function renderMonaco(fence, ctx = {}) {
  const { lang, kind, options } = parseMonacoInfo(fence.info);
  if (kind === 'monaco-write') {
    // Saving to the file needs the dev server; this is phase 3.
    console.warn('[slides] {monaco-write} is not supported yet, the editor is shown without saving');
  }
  const [original, modified] = (kind === 'monaco-diff' ? fence.code.split(DIFF_SEPARATOR, 2) : [fence.code]).map((s) => s.trimEnd());
  const a = attrs({
    lang,
    runnable: kind === 'monaco-run' || undefined,
    lines: options.lines ?? ctx.headmatter?.lineNumbers,
    readonly: options.readonly,
    height: options.height,
    autorun: options.autorun === undefined ? undefined : String(options.autorun),
    showOutputAt: options.showOutputAt,
  });
  const diff = modified === undefined ? '' : ` diff="${pack(modified)}"`;
  return `<monaco${a} packed="${pack(original)}"${diff}></monaco>`;
}
