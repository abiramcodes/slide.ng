import {
  dragName,
  findDragSites,
  isPosition,
  setDragPosition,
  tagDragSites,
  toArrayStyle,
  toPlainStyle,
} from './drag-sites.mjs';

const md = [
  '# Title',
  '<img slide-ng-drag="[10,20,30,40]" src="a.png">',
  '',
  'Text with `<slide-ng-drag>` in code.',
  '```html',
  '<div slide-ng-drag>in a fence</div>',
  '```',
  '<slide-ng-drag pos="1,2,3,4">hello</slide-ng-drag>',
  '<div class="x" slide-ng-drag="square">frontmatter id</div>',
  '<slide-ng-drag-arrow />',
  '<p slide-ng-drag>bare</p>',
].join('\n');

describe('findDragSites', () => {
  it('finds directives and components in order, outside code', () => {
    const sites = findDragSites(md);
    expect(sites.map((s) => s.tag)).toEqual([
      'img',
      'slide-ng-drag',
      'div',
      'slide-ng-drag-arrow',
      'p',
    ]);
    expect(sites.map((s) => s.component)).toEqual([false, true, false, true, false]);
  });
  it('does not mistake slide-ng-drag-like names for it', () => {
    expect(
      findDragSites('<div slide-ng-dragon slide-ng-drag-x data-slide-ng-drag="1"></div>'),
    ).toHaveLength(0);
  });
  it('reads a quoted > inside an attribute', () => {
    expect(findDragSites('<img alt="a>b" slide-ng-drag>')).toHaveLength(1);
  });
});

describe('tagDragSites', () => {
  it('adds the number after the tag name', () => {
    const out = tagDragSites(md);
    expect(out).toContain('<img drag-site="0" slide-ng-drag="[10,20,30,40]"');
    expect(out).toContain('<slide-ng-drag drag-site="1" pos="1,2,3,4">');
    expect(out).toContain('<p drag-site="4" slide-ng-drag>');
    expect(out).toContain('<div slide-ng-drag>in a fence</div>'); // code is left alone
  });
});

describe('setDragPosition', () => {
  it('replaces the value of a directive', () => {
    expect(setDragPosition(md, 0, '[1,2,3,4]')).toContain(
      '<img slide-ng-drag="[1,2,3,4]" src="a.png">',
    );
    expect(setDragPosition(md, 0, '1,2,3,_')).toContain(
      '<img slide-ng-drag="[1,2,3,NaN]" src="a.png">',
    );
  });
  it('turns a bare slide-ng-drag into one with a value', () => {
    expect(setDragPosition(md, 4, '[5,6,7,NaN]')).toContain(
      '<p slide-ng-drag="[5,6,7,NaN]">bare</p>',
    );
  });
  it('replaces pos of a component and adds it when missing', () => {
    expect(setDragPosition(md, 1, '9,8,7,6,15')).toContain('<slide-ng-drag pos="9,8,7,6,15">');
    expect(setDragPosition(md, 3, '1,2,3,4')).toContain('<slide-ng-drag-arrow pos="1,2,3,4" />');
  });
  it('leaves everything else of the text as it was', () => {
    const out = setDragPosition(md, 1, '9,8,7,6')!;
    expect(out.replace('pos="9,8,7,6"', 'pos="1,2,3,4"')).toBe(md);
  });
  it('writes the plain spelling into components', () => {
    expect(setDragPosition(md, 1, '[9,8,7,NaN]')).toContain('<slide-ng-drag pos="9,8,7,_">');
  });
  it('leaves named positions to the frontmatter', () => {
    expect(setDragPosition(md, 2, '1,2,3,4')).toBeNull();
    expect(dragName(md, 2)).toBe('square');
    expect(dragName(md, 0)).toBeNull();
    expect(dragName('<slide-ng-drag pos="box">x</slide-ng-drag>', 0)).toBe('box');
  });
  it('gives null for a missing site or a position that is not numbers', () => {
    expect(setDragPosition(md, 99, '1,2,3')).toBeNull();
    expect(setDragPosition(md, 0, '1,2,3"><script>')).toBeNull();
    expect(setDragPosition(md, 0, '1,2')).toBeNull();
  });
});

describe('spellings', () => {
  it('convert both ways', () => {
    expect(toArrayStyle('1,2,3,_,5')).toBe('[1,2,3,NaN,5]');
    expect(toArrayStyle('[1,2,3,4]')).toBe('[1,2,3,4]');
    expect(toPlainStyle('[1,2,3,NaN]')).toBe('1,2,3,_');
  });
});

describe('isPosition', () => {
  it('accepts the two spellings and automatic height', () => {
    for (const p of ['1,2,3,4', '[1,2,3,4]', '1,2,3,_', '[1,2,3,NaN,30]', '-5.5,2,3'])
      expect(isPosition(p)).toBe(true);
  });
  it('refuses the rest', () => {
    for (const p of ['', 'a,b,c', '1,2,3,4,5,6', '1;2;3', '"1,2,3"', 5, null])
      expect(isPosition(p as string)).toBe(false);
  });
});
