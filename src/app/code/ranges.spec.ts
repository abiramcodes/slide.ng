import { highlightLines, parseRange, rangeAt } from './ranges';

describe('parseRange', () => {
  it('reads single lines and ranges', () => {
    expect(parseRange(10, '2,5-7')).toEqual([2, 5, 6, 7]);
  });
  it('reads all, * and none', () => {
    expect(parseRange(3, 'all')).toEqual([1, 2, 3]);
    expect(parseRange(3, '*')).toEqual([1, 2, 3]);
    expect(parseRange(3, 'none')).toEqual([]);
    expect(parseRange(3, undefined)).toEqual([1, 2, 3]);
  });
  it('reads an open range and drops lines past the end', () => {
    expect(parseRange(4, '3-')).toEqual([3, 4]);
    expect(parseRange(4, '3,9')).toEqual([3]);
  });
});

describe('rangeAt', () => {
  it('takes the range for the click and the final one after the last', () => {
    expect(rangeAt(['1', '2', '3'], 1, '3')).toEqual({ text: '2', hide: false });
    expect(rangeAt(['1', '2', '3'], 9, '3')).toEqual({ text: '3', hide: false });
  });
  it('hide hides the block and uses the next range for when it shows', () => {
    expect(rangeAt(['hide', '2'], 0, '2')).toEqual({ text: '2', hide: true });
  });
});

describe('highlightLines', () => {
  it('marks wanted lines and dims the others, counting from startLine', () => {
    const lines = [0, 1, 2].map(() => [document.createElement('span')]);
    highlightLines(lines, '6', 5);
    expect(lines.map(([e]) => e.classList.contains('highlighted'))).toEqual([false, true, false]);
    expect(lines.map(([e]) => e.classList.contains('dishonored'))).toEqual([true, false, true]);
  });
});
