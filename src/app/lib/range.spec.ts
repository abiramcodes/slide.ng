import { describe, expect, it } from 'vitest';
import { parseRange } from './range';

describe('parseRange', () => {
  it('lists every slide for nothing, all and *', () => {
    expect(parseRange(3, undefined)).toEqual([1, 2, 3]);
    expect(parseRange(3, 'all')).toEqual([1, 2, 3]);
    expect(parseRange(3, '*')).toEqual([1, 2, 3]);
  });
  it('reads numbers and ranges', () => {
    expect(parseRange(10, '1,3-5')).toEqual([1, 3, 4, 5]);
    expect(parseRange(10, '8-')).toEqual([8, 9, 10]);
    expect(parseRange(10, '5;2')).toEqual([2, 5]);
  });
  it('drops numbers out of range and duplicates, and ignores junk', () => {
    expect(parseRange(4, '0,2,2,9,x,3-7')).toEqual([2, 3, 4]);
  });
  it('none is empty', () => {
    expect(parseRange(4, 'none')).toEqual([]);
  });
});
