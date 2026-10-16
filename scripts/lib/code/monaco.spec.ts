import { inflateRawSync } from 'node:zlib';
import { isMonaco, renderMonaco } from './monaco.mjs';
import { hasMonaco } from '../features.mjs';

const unpack = (html: string, name: string) =>
  JSON.parse(
    inflateRawSync(
      Buffer.from(new RegExp(`${name}="([^"]+)"`).exec(html)![1], 'base64'),
    ).toString(),
  );

describe('monaco fences', () => {
  it('knows {monaco}, {monaco-diff} and {monaco-run} but not line ranges', () => {
    expect(isMonaco({ info: 'ts {monaco}' })).toBe(true);
    expect(isMonaco({ info: 'ts {monaco-run} {autorun:false}' })).toBe(true);
    expect(isMonaco({ info: 'ts {2,3}' })).toBe(false);
  });
  it('writes <slide-ng-monaco> with the code packed (braces never reach the template)', () => {
    const html = renderMonaco({ info: 'ts {monaco}', code: 'const a = { b: `${1}` }' });
    expect(html).toMatch(
      /^<slide-ng-monaco lang="ts" packed="[A-Za-z0-9+/=]+"><\/slide-ng-monaco>$/,
    );
    expect(unpack(html, 'packed')).toBe('const a = { b: `${1}` }');
  });
  it('splits a diff at the ~~~ line', () => {
    const html = renderMonaco({ info: 'ts {monaco-diff}', code: 'one\n~~~\ntwo' });
    expect(unpack(html, 'packed')).toBe('one');
    expect(unpack(html, 'diff')).toBe('two');
  });
  it('passes the run options on', () => {
    const html = renderMonaco({
      info: "ts {monaco-run} {autorun:false,showOutputAt:'+1',height:'auto'}",
      code: 'x',
    });
    expect(html).toContain('runnable="true"');
    expect(html).toContain('autorun="false"');
    expect(html).toContain('showOutputAt="+1"');
    expect(html).toContain('height="auto"');
  });
  it('warns that {monaco-write} is not supported yet, and still draws the editor', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(renderMonaco({ info: 'ts {monaco-write}', code: 'x' })).toContain('<slide-ng-monaco');
    expect(warn.mock.calls[0][0]).toContain('monaco-write');
    warn.mockRestore();
  });
});

describe('feature detection for the editor', () => {
  it('sees the fence option, the tag and a snippet with the option', () => {
    expect(hasMonaco('```ts {monaco}\nx\n```')).toBe(true);
    expect(hasMonaco('<slide-ng-monaco code="x" />')).toBe(true);
    expect(hasMonaco('<<< ./a.ts {monaco}')).toBe(true);
  });
  it('is false for plain code', () => {
    expect(hasMonaco('```ts {1|2}\nx\n```')).toBe(false);
  });
});
