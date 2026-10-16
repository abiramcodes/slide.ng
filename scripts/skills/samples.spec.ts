import { describe, expect, it } from 'vitest';
import { extractSamples } from './samples.mjs';

const page = (body: string) => extractSamples(body, 'ref.md');

describe('extractSamples', () => {
  it('takes the md fence after the marker, and counts the other md fences as fragments', () => {
    const r = page('<!-- verify -->\n```md\n# A\n```\n\n```md\nfragment\n```\n');
    expect(r.samples).toEqual([{ id: 'ref.md#1', line: 3, text: '# A\n' }]);
    expect(r.unmarked).toBe(1);
    expect(r.problems).toEqual([]);
  });
  it('allows blank lines between the marker and the fence and fences of four backticks', () => {
    const r = page('<!-- verify -->\n\n````md\n```ts\nx\n```\n````\n');
    expect(r.samples[0].text).toBe('```ts\nx\n```\n');
  });
  it('does not read a marker inside another fence', () => {
    const r = page('````md\n<!-- verify -->\n```md\n# no\n```\n````\n');
    expect(r.samples).toEqual([]);
  });
  it('collects companion files', () => {
    const r = page('<!-- verify-file: components/hello.ts -->\n```ts\nexport class A {}\n```\n');
    expect(r.files).toEqual([
      { path: 'components/hello.ts', line: 3, text: 'export class A {}\n' },
    ]);
  });
  it('reports a marker without a fence, a wrong language and an unsafe path', () => {
    expect(page('<!-- verify -->\ntext\n').problems[0]).toContain('not followed by a code fence');
    expect(page('<!-- verify -->\n```ts\nx\n```\n').problems[0]).toContain('needs an md fence');
    expect(page('<!-- verify-file: ../x.ts -->\n```ts\nx\n```\n').problems[0]).toContain(
      'relative',
    );
    expect(page('<!-- verify -->').problems[0]).toContain('not followed');
  });
  it('reports a fence that is never closed', () => {
    expect(page('```md\nx\n').problems[0]).toContain('never closed');
  });
});
