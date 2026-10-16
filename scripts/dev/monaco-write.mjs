// `{monaco-write}`: the editor saves its text into the file it was loaded from (`<<< ./snippet.ts {monaco-write}`).
// The generator lists the files it found in `.slide-ng/monaco-files.json` as { id: path }. The page sends only an id:
// a file that is not on that list cannot be written, whatever the request says.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { confine } from './auth.mjs';
import { HttpError } from './http-error.mjs';

export const MONACO_FILES = '.slide-ng/monaco-files.json';
export const MAX_FILE = 500_000;

function targets(root) {
  try { return JSON.parse(readFileSync(join(root, MONACO_FILES), 'utf8')); } catch { return {}; }
}

export function writeMonaco(ctx, id, content) {
  if (typeof content !== 'string' || content.length > MAX_FILE) throw new HttpError(413, 'text too large');
  const list = targets(ctx.root);
  if (typeof id !== 'string' || !Object.hasOwn(list, id) || typeof list[id] !== 'string') throw new HttpError(404, 'this editor is not writable');
  const file = confine(ctx.root, list[id]);
  if (!file || !existsSync(file)) throw new HttpError(403, 'the file is not in the project');
  writeFileSync(file, content.endsWith('\n') ? content : `${content}\n`);
}
