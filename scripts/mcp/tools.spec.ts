// @vitest-environment node
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TOOLS } from './tools.mjs';

const tool = (name: string) => TOOLS.find((t) => t.name === name)! as any;

describe('get_slide reads inside the deck only', () => {
  const base = mkdtempSync(join(tmpdir(), 'mcp-read-'));
  const root = join(base, 'deck');
  mkdirSync(root);
  writeFileSync(join(base, 'outside.md'), '# Outside secret\n');
  const entry = join(root, 'slides.md');
  const deck = (head: string) =>
    writeFileSync(entry, `---\n${head}title: T\n---\n\n# One\n\n---\nsrc: ../outside.md\n---\n`);
  const ctx = { root, entry };

  it('refuses a slide imported from outside the deck folder', async () => {
    deck('');
    await expect(tool('get_slide').run(ctx, { no: 2 })).rejects.toThrow('allowOutsideRoot: true');
  });
  it('reads it when the deck opts in', async () => {
    deck('allowOutsideRoot: true\n');
    const got = await tool('get_slide').run(ctx, { no: 2 });
    expect(got.markdown).toContain('Outside secret');
  });
});
