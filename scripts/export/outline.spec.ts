import { describe, expect, it } from 'vitest';
import { PDFDocument, PDFName } from '@cantoo/pdf-lib';
import { addOutline, outlineTree } from './outline.mjs';

const entry = (title: string, level: number | null, page: number) => ({ title, level, page });

describe('outlineTree', () => {
  it('nests a deeper title inside the one before', () => {
    const tree = outlineTree([
      entry('A', 1, 0),
      entry('A.1', 2, 1),
      entry('A.2', 2, 2),
      entry('B', 1, 3),
    ]);
    expect(tree.map((t: any) => t.title)).toEqual(['A', 'B']);
    expect(tree[0].children.map((t: any) => t.title)).toEqual(['A.1', 'A.2']);
  });
  it('keeps titles without a level at the top', () => {
    expect(outlineTree([entry('A', null, 0), entry('B', null, 1)]).length).toBe(2);
  });
});

describe('addOutline', () => {
  it('writes bookmarks that can be read back', async () => {
    const pdf = await PDFDocument.create();
    for (let i = 0; i < 3; i++) pdf.addPage([100, 100]);
    addOutline(pdf, outlineTree([entry('One', 1, 0), entry('Two', 2, 1), entry('Three', 1, 2)]));
    const reloaded = await PDFDocument.load(await pdf.save());
    const outlines = reloaded.catalog.lookup(PDFName.of('Outlines')) as any;
    expect(outlines.get(PDFName.of('Count')).asNumber()).toBe(3);
  });
});
