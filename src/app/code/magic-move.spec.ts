import { stepAt } from './magic-move';

describe('stepAt', () => {
  // two steps: the first has ranges * | 1 | 2-3 (two clicks), the second only one range
  const ranges = [['*', '1', '2-3'], ['all']];
  it('before the first click shows the first range of the first step', () => {
    expect(stepAt(ranges, -1, 2)).toEqual({ step: 0, range: '*' });
  });
  it('each click inside a step moves to its next range', () => {
    expect(stepAt(ranges, 0, 2)).toEqual({ step: 0, range: '1' });
    expect(stepAt(ranges, 1, 2)).toEqual({ step: 0, range: '2-3' });
  });
  it('the next click starts the next step', () => {
    expect(stepAt(ranges, 2, 2)).toEqual({ step: 1, range: 'all' });
  });
  it('after the last click the last step stays', () => {
    expect(stepAt(ranges, 99, 2)).toEqual({ step: 1, range: 'all' });
  });
});
