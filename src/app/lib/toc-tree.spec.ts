import { TocSlide, buildTocTree, filterToc } from './toc-tree';

const slide = (no: number, title: string | null, level: number | null, extra: Partial<TocSlide> = {}): TocSlide =>
  ({ no, title, level, routeAlias: null, hideInToc: false, ...extra });

// 1 Intro, 2 Part A (1), 3 A one (2), 4 A two (2), 5 deep (3), 6 Part B (1), 7 untitled
const slides = [slide(1, 'Intro', 1), slide(2, 'Part A', 1), slide(3, 'A one', 2), slide(4, 'A two', 2), slide(5, 'deep', 3), slide(6, 'Part B', 1), slide(7, null, null)];
const names = (tree: { title: string; children: any[] }[]): string[] => tree.map((i) => (i.children.length ? `${i.title}[${names(i.children)}]` : i.title));
const all = { minDepth: 1, maxDepth: Infinity, mode: 'all' as const };

describe('buildTocTree', () => {
  it('nests slides by level and skips slides without a title', () => {
    expect(names(buildTocTree(slides, 1))).toEqual(['Intro', 'Part A[A one,A two[deep]]', 'Part B']);
  });
  it('uses the routeAlias as the path when there is one', () => {
    const tree = buildTocTree([slide(1, 'A', 1, { routeAlias: 'start' }), slide(2, 'B', 1)], 1);
    expect(tree.map((i) => i.path)).toEqual(['start', '2']);
  });
  it('drops hideInToc slides together with their children', () => {
    const tree = buildTocTree([slide(1, 'A', 1), slide(2, 'B', 2, { hideInToc: true }), slide(3, 'C', 1)], 1);
    expect(names(tree)).toEqual(['A', 'C']);
  });
  it('marks the active item, its parents, and the items below an active one', () => {
    const tree = buildTocTree(slides, 4);
    const partA = tree[1], aTwo = partA.children[1];
    expect([partA.active, partA.activeParent, aTwo.active, aTwo.children[0].hasActiveParent]).toEqual([false, true, true, true]);
    expect(partA.children[0].active).toBe(false);
  });
});

describe('filterToc', () => {
  const tree = buildTocTree(slides, 4);
  it('maxDepth cuts the tree', () => {
    expect(names(filterToc(tree, { ...all, maxDepth: 1 }))).toEqual(['Intro', 'Part A', 'Part B']);
    expect(names(filterToc(tree, { ...all, maxDepth: 2 }))).toEqual(['Intro', 'Part A[A one,A two]', 'Part B']);
  });
  it('minDepth starts at the active branch', () => {
    expect(names(filterToc(tree, { ...all, minDepth: 2 }))).toEqual(['A one', 'A two[deep]']);
  });
  it('onlyCurrentTree keeps the path to the current slide and what is below it', () => {
    expect(names(filterToc(tree, { ...all, mode: 'onlyCurrentTree' }))).toEqual(['Part A[A two[deep]]']);
  });
  it('onlySiblings keeps every list that holds the current slide', () => {
    expect(names(filterToc(tree, { ...all, mode: 'onlySiblings' }))).toEqual(['Intro', 'Part A[A one,A two[deep]]', 'Part B']);
  });
});
