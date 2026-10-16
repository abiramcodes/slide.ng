import { LAYOUTS, layoutName } from './layouts.mjs';
import { slideSource } from './emit.mjs';
import { indexSource } from './index-source.mjs';
import { parseDeck } from './parse-deck.mjs';
import { initHighlighter } from './code/highlighter.mjs';

// Code fences are highlighted while generating, so the highlighter must be ready.
beforeAll(() => initHighlighter({ langs: ['ts', 'html'] }));

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
    expect(warn.mock.calls[0][0]).toContain('unknown layout "nope"');
    expect(warn.mock.calls[0][0]).toContain('two-cols-header'); // the message lists the real names
    warn.mockRestore();
  });
  it('knows every Slidev layout', () => {
    const names = ['default', 'cover', 'center', 'end', 'fact', 'full', 'image', 'image-left', 'image-right', 'iframe',
      'iframe-left', 'iframe-right', 'intro', 'none', 'quote', 'section', 'statement', 'two-cols', 'two-cols-header', '404', 'error'];
    expect(Object.keys(LAYOUTS).sort()).toEqual(names.sort());
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
    expect(src).toContain('<p>left</p>\\n<ng-container ngProjectAs=\\"[right]\\"><p>right</p>');
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
    expect(src).toContain('imports: [DefaultLayout, CodeBlockWrapper]'); // the fence itself is a code block
    expect(src).not.toContain('Counter');
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

describe('slideSource: layout props and slots', () => {
  it('passes frontmatter keys the layout knows as attributes', () => {
    const src = slideSource(slide({ layout: 'image-left', image: '/a.png', backgroundSize: 'contain', other: 1 }, 'x'), 2);
    expect(src).toContain('<sn-image-left image=\\"/a.png\\" backgroundSize=\\"contain\\">');
    expect(src).not.toContain('other');
  });
  it('sends `class` to the content for layouts with a class prop, to the layout element otherwise', () => {
    expect(slideSource(slide({ layout: 'two-cols', class: 'c' }, 'x'), 2)).toContain('<sn-two-cols contentClass=');
    expect(slideSource(slide({ layout: 'fact', class: 'c' }, 'x'), 2)).toContain('<sn-fact class=');
  });
  it('handles several named slots, in any order', () => {
    const src = slideSource(slide({ layout: 'two-cols-header' }, 'top\n\n::right::\nR\n\n::left::\nL\n\n::bottom::\nB'), 2);
    expect(src.indexOf('[right]')).toBeLessThan(src.indexOf('[left]'));
    expect(src).toContain('ngProjectAs=\\"[bottom]\\"');
    expect(src).toContain('<p>top</p>');
  });
  it('warns about a slot the layout does not have and keeps the content visible', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const src = slideSource(slide({ layout: 'center' }, 'a\n\n::nope::\nb'), 2);
    expect(warn.mock.calls[0][0]).toContain('no slot "nope"');
    expect(src).toContain('<p>b</p>');
    expect(src).not.toContain('ngProjectAs');
    warn.mockRestore();
  });
  it('does not read ::x:: inside a code fence as a slot', () => {
    expect(slideSource(slide({ layout: 'two-cols' }, '```\n::right::\n```'), 2)).not.toContain('ngProjectAs');
  });
});

describe('slideSource: styles and clicks', () => {
  it('moves a <style> block into the component, scoped to the slide tag', () => {
    const src = slideSource(slide({}, '# A\n\n<style>\nh1 { color: red }\n</style>'), 7);
    expect(src).not.toContain('<style');
    expect(src).toContain('styles: ["slide-007 {\\nh1 { color: red }\\n}"]');
    expect(src).toContain('ViewEncapsulation.None');
  });
  it('leaves a <style> inside a code fence alone', () => {
    const src = slideSource(slide({}, '```html\n<style>a{}</style>\n```'), 2);
    expect(src).not.toContain('styles:');
  });
  it('provides a click total from the `clicks` frontmatter', () => {
    expect(slideSource(slide({ clicks: 4 }, 'x'), 2)).toContain('{ provide: CLICKS_TOTAL, useValue: 4 }');
  });
});

describe('indexSource', () => {
  it('lists every slide with its metadata and keeps unknown frontmatter keys', async () => {
    const deck = await parseDeck('/d/slides.md', { '/d/slides.md': '---\ntitle: T\n---\n\n# A\n\n---\nlayout: center\nfoo: bar\nroute\u0041lias: intro\nhideInToc: true\ntransition: fade\n---\n\n## B\n\n<!-- n -->\n' });
    const src = indexSource(deck);
    expect(src).toContain('import Slide001 from \'./slide-001\';');
    expect(src).toContain('"layout":"center"');
    expect(src).toContain('"foo":"bar"');
    expect(src).toContain('"note":"n"');
    expect(src).toContain('"routeAlias":"intro"');
    expect(src).toContain('"hideInToc":true');
    expect(src).toContain('"transition":"fade"');
    expect(src).toContain('"level":2');
    expect(src).toContain('export const HEADMATTER');
    expect(src.match(/component: Slide00\d/g)?.length).toBe(2);
  });
});

describe('slideSource: built-in components are imported when the slide uses them', () => {
  const imports = (md: string) => /imports: \[(.*)\]/.exec(slideSource(slide({}, md), 2))![1];
  it('finds each tag', () => {
    expect(imports('<arrow x1="1" y1="1" x2="2" y2="2" />')).toContain('Arrow');
    expect(imports('<auto-fit-text>x</auto-fit-text>')).toContain('AutoFitText');
    expect(imports('<transform scale="0.5">x</transform>')).toContain('Transform');
    expect(imports('<youtube id="a" />')).toContain('Youtube');
    expect(imports('<slide-video v-click></slide-video>')).toContain('SlideVideo');
    expect(imports('<tweet id="20" />')).toContain('Tweet');
    expect(imports('<blue-sky uri="at://x" />')).toContain('BlueSky');
  });
  it('finds v-mark (with modifiers, or as a binding) and v-motion', () => {
    expect(imports('<span v-mark.red="1">x</span>')).toContain('VMark');
    expect(imports('<span [v-mark]="{ at: 2 }">x</span>')).toContain('VMark');
    expect(imports('<div v-motion :enter="{ x: 0 }">x</div>')).toContain('VMotion');
  });
  it('does not mix <transform> up with the longer names or other words', () => {
    expect(imports('plain text about a transformation')).toBe('DefaultLayout');
  });
});
