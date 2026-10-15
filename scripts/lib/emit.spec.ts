import { indexSource, layoutName, slideSource } from './emit.mjs';
import { parseDeck } from './parse-deck.mjs';

const slide = (frontmatter: Record<string, unknown>, content: string) => ({ title: null, frontmatter, content, note: undefined });

describe('layoutName', () => {
  it('first slide defaults to cover, the others to default', () => {
    expect(layoutName({}, 0)).toBe('cover');
    expect(layoutName({}, 1)).toBe('default');
  });
  it('uses the layout from the frontmatter', () => {
    expect(layoutName({ layout: 'center' }, 0)).toBe('center');
  });
  it('falls back to default for an unknown layout, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(layoutName({ layout: 'nope' }, 3)).toBe('default');
    expect(warn).toHaveBeenCalled();
  });
});

describe('slideSource', () => {
  it('wraps the content in its layout and imports it', () => {
    const src = slideSource(slide({ layout: 'center' }, '# Hi'), 2);
    expect(src).toContain('<sn-center><h1>Hi</h1>');
    expect(src).toContain("import { CenterLayout } from '../../app/layouts/center';");
    expect(src).toContain('imports: [CenterLayout]');
    expect(src).toContain('export default class Slide002');
  });
  it('carries the frontmatter class to the layout element', () => {
    expect(slideSource(slide({ class: 'text-center a"b' }, 'x'), 2)).toContain('<sn-default class=\\"text-center a&quot;b\\">');
  });
  it('splits two-cols content at ::right::', () => {
    const src = slideSource(slide({ layout: 'two-cols' }, 'left\n\n::right::\n\nright'), 2);
    expect(src).toContain('<p>left</p>\\n<div right><p>right</p>');
  });
  it('imports only the components the slide uses', () => {
    const plain = slideSource(slide({}, 'text'), 2);
    expect(plain).not.toContain('Counter');
    expect(plain).not.toContain('VClick');
    const rich = slideSource(slide({}, '<app-counter [start]="1" />\n\n<div v-click>a</div>'), 2);
    expect(rich).toContain('imports: [DefaultLayout, VClick, Counter]');
  });
  it('does not import a component that is only mentioned inside code', () => {
    const src = slideSource(slide({}, '```html\n<app-counter />\n<div v-click>\n```\n\nand `<v-clicks>`'), 2);
    expect(src).toContain('imports: [DefaultLayout]');
  });
  it('detects v-clicks, [v-click] bindings and v-after', () => {
    expect(slideSource(slide({}, '<v-clicks>\n\n- a\n\n</v-clicks>'), 2)).toContain('VClicks');
    expect(slideSource(slide({}, '<div [v-click]="[1,2]">a</div>'), 2)).toContain('VClick');
    expect(slideSource(slide({}, '<div v-after>a</div>'), 2)).toContain('VClick');
  });
  it('provides clicksStart when the frontmatter sets it', () => {
    expect(slideSource(slide({ clicksStart: 2 }, 'x'), 2)).toContain('{ provide: CLICKS_START, useValue: 2 }');
    expect(slideSource(slide({}, 'x'), 2)).not.toContain('useValue');
  });
  it('writes the template as one safe string literal', () => {
    const src = slideSource(slide({}, '```ts\nconst a = `x`; "q"\n```'), 2);
    expect(src).toMatch(/template: ".*"/);
  });
});

describe('indexSource', () => {
  it('lists every slide with its metadata and keeps unknown frontmatter keys', () => {
    const deck = parseDeck('---\ntitle: T\n---\n\n# A\n\n---\nlayout: center\nfoo: bar\n---\n\n# B\n\n<!-- n -->\n');
    const src = indexSource(deck);
    expect(src).toContain('import Slide001 from \'./slide-001\';');
    expect(src).toContain('"layout":"center"');
    expect(src).toContain('"foo":"bar"');
    expect(src).toContain('"note":"n"');
    expect(src).toContain('export const HEADMATTER');
    expect(src.match(/component: Slide00\d/g)?.length).toBe(2);
  });
});
