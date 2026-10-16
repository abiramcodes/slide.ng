import { RENAMED_ATTRIBUTES, RENAMED_ELEMENTS, assertNoRenamedNames } from './renamed.mjs';
import { slideSource } from './emit.mjs';
import { initHighlighter } from './code/highlighter.mjs';

beforeAll(() => initHighlighter({ langs: ['ts', 'html'] }));

const check =
  (html: string, own: string[] = []) =>
  () =>
    assertNoRenamedNames(html, 4, own);

describe('assertNoRenamedNames', () => {
  it('names the new attribute for an old one, with modifiers or as a binding', () => {
    expect(check('<li v-click>a</li>')).toThrow('renamed to slide-ng-click');
    expect(check('<li v-after="1">a</li>')).toThrow('renamed to slide-ng-after');
    expect(check('<li v-click-hide>a</li>')).toThrow('renamed to slide-ng-click-hide');
    expect(check('<li [v-click]="[1, 2]">a</li>')).toThrow('renamed to slide-ng-click');
    expect(check('<span v-mark.red.circle="2">a</span>')).toThrow('renamed to slide-ng-mark');
    expect(check('<div v-motion :initial="{ x: 0 }"></div>')).toThrow('renamed to slide-ng-motion');
    expect(check('<img v-drag="[1,2,3,4]">')).toThrow('renamed to slide-ng-drag');
  });

  it('names the new element for an old one', () => {
    for (const [oldName, newName] of Object.entries(RENAMED_ELEMENTS))
      expect(check(`<${oldName} a="1"></${oldName}>`)).toThrow(`renamed to ${newName}`);
  });

  it('says which slide it found the old name in', () => {
    expect(check('<v-clicks>x</v-clicks>')).toThrow('slide 4');
  });

  it('lets the new names pass', () => {
    const fine = [
      '<li slide-ng-click>a</li>',
      '<span slide-ng-mark.red.circle="2">a</span>',
      '<slide-ng-clicks><li>a</li></slide-ng-clicks>',
      '<slide-ng-toc columns="2" />',
      '<p class="v-click">text mentions v-click</p>',
      '<div data-v-click="1"></div>',
    ];
    for (const html of fine) expect(check(html)).not.toThrow();
  });

  it('keeps matching strictly: only whole attribute and tag names', () => {
    expect(check('<li v-clicky>a</li>')).not.toThrow();
    expect(check('<li my-v-click>a</li>')).not.toThrow();
    expect(check('<v-clickable>a</v-clickable>')).not.toThrow();
    expect(check('<arrows></arrows><transforms></transforms>')).not.toThrow();
  });

  it('leaves a name alone that the deck declares as its own component', () => {
    expect(check('<arrow x="1" />', ['arrow'])).not.toThrow();
    expect(check('<arrow x="1" />')).toThrow('renamed to slide-ng-arrow');
  });

  it('has a new name for every old one', () => {
    for (const to of [...Object.values(RENAMED_ATTRIBUTES), ...Object.values(RENAMED_ELEMENTS)])
      expect(to.startsWith('slide-ng-')).toBe(true);
  });
});

describe('slideSource with an old name', () => {
  const md = (content: string) => ({ title: null, frontmatter: {}, content, note: undefined });
  it('stops with the helpful message', () => {
    expect(() => slideSource(md('- a\n\n<v-clicks>\n\n- b\n\n</v-clicks>'), 2)).toThrow(
      'renamed to slide-ng-clicks',
    );
  });
  it('does not look into code', () => {
    expect(() =>
      slideSource(md('```html\n<v-click>x</v-click>\n```\n\n`<slide-toc />`'), 2),
    ).not.toThrow();
  });
});
