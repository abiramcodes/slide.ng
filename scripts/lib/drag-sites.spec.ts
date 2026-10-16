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
  '<img v-drag="[10,20,30,40]" src="a.png">',
  '',
  'Text with `<v-drag>` in code.',
  '```html',
  '<div v-drag>in a fence</div>',
  '```',
  '<v-drag pos="1,2,3,4">hello</v-drag>',
  '<div class="x" v-drag="square">frontmatter id</div>',
  '<v-drag-arrow />',
  '<p v-drag>bare</p>',
].join('\n');

describe('findDragSites', () => {
  it('finds directives and components in order, outside code', () => {
    const sites = findDragSites(md);
    expect(sites.map((s) => s.tag)).toEqual(['img', 'v-drag', 'div', 'v-drag-arrow', 'p']);
    expect(sites.map((s) => s.component)).toEqual([false, true, false, true, false]);
  });
  it('does not mistake v-drag-like names for it', () => {
    expect(findDragSites('<div v-dragon v-drag-x data-v-drag="1"></div>')).toHaveLength(0);
  });
  it('reads a quoted > inside an attribute', () => {
    expect(findDragSites('<img alt="a>b" v-drag>')).toHaveLength(1);
  });
});

describe('tagDragSites', () => {
  it('adds the number after the tag name', () => {
    const out = tagDragSites(md);
    expect(out).toContain('<img drag-site="0" v-drag="[10,20,30,40]"');
    expect(out).toContain('<v-drag drag-site="1" pos="1,2,3,4">');
    expect(out).toContain('<p drag-site="4" v-drag>');
    expect(out).toContain('<div v-drag>in a fence</div>'); // code is left alone
  });
});

describe('setDragPosition', () => {
  it('replaces the value of a directive', () => {
    expect(setDragPosition(md, 0, '[1,2,3,4]')).toContain('<img v-drag="[1,2,3,4]" src="a.png">');
    expect(setDragPosition(md, 0, '1,2,3,_')).toContain('<img v-drag="[1,2,3,NaN]" src="a.png">');
  });
  it('turns a bare v-drag into one with a value', () => {
    expect(setDragPosition(md, 4, '[5,6,7,NaN]')).toContain('<p v-drag="[5,6,7,NaN]">bare</p>');
  });
  it('replaces pos of a component and adds it when missing', () => {
    expect(setDragPosition(md, 1, '9,8,7,6,15')).toContain('<v-drag pos="9,8,7,6,15">');
    expect(setDragPosition(md, 3, '1,2,3,4')).toContain('<v-drag-arrow pos="1,2,3,4" />');
  });
  it('leaves everything else of the text as it was', () => {
    const out = setDragPosition(md, 1, '9,8,7,6')!;
    expect(out.replace('pos="9,8,7,6"', 'pos="1,2,3,4"')).toBe(md);
  });
  it('writes the plain spelling into components', () => {
    expect(setDragPosition(md, 1, '[9,8,7,NaN]')).toContain('<v-drag pos="9,8,7,_">');
  });
  it('leaves named positions to the frontmatter', () => {
    expect(setDragPosition(md, 2, '1,2,3,4')).toBeNull();
    expect(dragName(md, 2)).toBe('square');
    expect(dragName(md, 0)).toBeNull();
    expect(dragName('<v-drag pos="box">x</v-drag>', 0)).toBe('box');
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
