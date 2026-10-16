// A PDF outline (the bookmarks panel) written with pdf-lib: slide titles, nested by heading level.
import { PDFHexString, PDFName, PDFNumber } from 'pdf-lib';

/**
 * Nests slides by title level, like Slidev: a title with a higher level than the one before goes inside it.
 * `entries` are `{ title, level, page }` in slide order (page is the PDF page index of the slide's first page).
 */
export function outlineTree(entries) {
  const tree = [];
  const add = (list, entry, depth) => {
    const last = list[list.length - 1];
    const titleLevel = entry.level;
    if (titleLevel && titleLevel > depth && last && last.titleLevel < titleLevel) add(last.children, entry, depth + 1);
    else list.push({ ...entry, titleLevel: titleLevel ?? depth, children: [] });
  };
  entries.forEach((e) => add(tree, e, 1));
  return tree;
}

/** Writes the tree into the document. Does nothing for an empty tree. */
export function addOutline(pdf, tree) {
  if (!tree.length) return;
  const ctx = pdf.context;
  const pages = pdf.getPages();
  const rootRef = ctx.nextRef();

  // Writes one level of items under `parent`; returns the first and last item and how many items there are in all.
  const writeLevel = (items, parent) => {
    const refs = items.map(() => ctx.nextRef());
    let count = items.length;
    items.forEach((item, i) => {
      const entry = {
        Title: PDFHexString.fromText(item.title),
        Parent: parent,
        Dest: [pages[Math.min(item.page, pages.length - 1)].ref, PDFName.of('Fit')],
      };
      if (i > 0) entry.Prev = refs[i - 1];
      if (i < items.length - 1) entry.Next = refs[i + 1];
      if (item.children.length) {
        const kids = writeLevel(item.children, refs[i]);
        Object.assign(entry, { First: kids.first, Last: kids.last, Count: PDFNumber.of(kids.count) });
        count += kids.count;
      }
      ctx.assign(refs[i], ctx.obj(entry));
    });
    return { first: refs[0], last: refs[refs.length - 1], count };
  };

  const top = writeLevel(tree, rootRef);
  ctx.assign(rootRef, ctx.obj({ Type: 'Outlines', First: top.first, Last: top.last, Count: PDFNumber.of(top.count) }));
  pdf.catalog.set(PDFName.of('Outlines'), rootRef);
  pdf.catalog.set(PDFName.of('PageMode'), PDFName.of('UseOutlines'));
}
