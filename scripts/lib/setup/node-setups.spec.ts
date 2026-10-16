// @vitest-environment node
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  findSetupFile,
  katexOptions,
  preparserExtensions,
  runSetups,
  shikiSetup,
  transformersSetup,
} from './node-setups.mjs';
import { applyPreTransformers } from './pre-transform.mjs';

// A root folder with the given setup files: { 'katex.ts': 'export default ...' }.
function root(id: string, files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'slide-ng-setup-'));
  mkdirSync(join(dir, 'setup'));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, 'setup', name), text);
  return { id, dir };
}

describe('setup files', () => {
  it('finds a file by name and any script extension', () => {
    const r = root('a', { 'katex.mjs': 'export default () => ({})' });
    expect(findSetupFile(r.dir, 'katex')).toMatch(/katex\.mjs$/);
    expect(findSetupFile(r.dir, 'shiki')).toBeNull();
  });

  it('reads TypeScript, so types and imports of a relative file work', async () => {
    const r = root('a', {
      'katex.ts':
        "import { macros } from './macros'; export default (): { macros: Record<string, string> } => ({ macros })",
      'macros.ts': "export const macros: Record<string, string> = { '\\\\RR': '\\\\mathbb{R}' };",
    });
    expect(await katexOptions([r])).toEqual({ macros: { '\\RR': '\\mathbb{R}' } });
  });

  it('puts the options of later roots over earlier ones', async () => {
    const a = root('a', { 'katex.ts': 'export default () => ({ strict: false, trust: true })' });
    const b = root('b', { 'katex.ts': 'export default () => ({ trust: false })' });
    expect(await katexOptions([a, b])).toEqual({ strict: false, trust: false });
  });

  it('says which root failed', async () => {
    const r = root('theme-x', { 'katex.ts': "export default () => { throw new Error('boom'); }" });
    await expect(katexOptions([r])).rejects.toThrow('setup/katex of theme-x failed: boom');
  });

  it('refuses a file that does not export a function', async () => {
    const r = root('a', { 'katex.ts': 'export default 5' });
    await expect(runSetups([r], 'katex')).rejects.toThrow('must export a function by default');
  });

  it('collects the languages of setup/shiki.ts and keeps the other options', async () => {
    const a = root('a', {
      'shiki.ts':
        "export default () => ({ langs: ['rust', { name: 'mine', scopeName: 'source.mine', patterns: [] }], colorReplacements: { '#fff': '#eee' } })",
    });
    const b = root('b', { 'shiki.ts': "export default () => ({ langs: ['go'] })" });
    const s = await shikiSetup([a, b]);
    expect(s.langNames).toEqual(['rust', 'go']);
    expect(s.grammars.map((g: { name: string }) => g.name)).toEqual(['mine']);
    expect(s.options).toEqual({ colorReplacements: { '#fff': '#eee' } });
  });

  it('joins transformers: markdown lists last root first, code blocks first root first', async () => {
    const a = root('a', {
      'transformers.ts': "export default () => ({ pre: ['a'], codeblocks: ['a'] })",
    });
    const b = root('b', {
      'transformers.ts':
        "export default () => ({ pre: ['b'], preCodeblock: ['c'], codeblocks: ['b'] })",
    });
    const t = await transformersSetup([a, b]);
    expect(t.pre).toEqual(['b', 'a', 'c']);
    expect(t.codeblocks).toEqual(['a', 'b']);
  });

  it('gives preparser extensions the file, headmatter and mode', async () => {
    const r = root('a', {
      'preparser.ts': 'export default (c: any) => [{ name: c.mode + c.headmatter.title }]',
    });
    expect(
      await preparserExtensions([r], {
        filepath: 'slides.md',
        headmatter: { title: 'T' },
        mode: 'dev',
      }),
    ).toEqual([{ name: 'devT' }]);
  });
});

describe('pre transformers', () => {
  it('edit each slide with a MagicString and know the slide', async () => {
    const slides = [
      { content: 'hello', title: 'one', frontmatter: {} },
      { content: 'bye', title: 'two', frontmatter: {} },
    ];
    await applyPreTransformers(
      slides,
      [
        async ({ s, slide }: any) => {
          s.replace('e', `E${slide.index}`);
        },
      ],
      {},
    );
    expect(slides.map((s) => s.content)).toEqual(['hE0llo', 'byE1']);
  });
});
