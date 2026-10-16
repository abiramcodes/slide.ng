import { coordinateScale } from './coordinate-scale';

describe('coordinateScale', () => {
  it('turns screen pixels into slide pixels', () => {
    expect(coordinateScale(2)).toBe(0.5);
    expect(coordinateScale(1280 / 980) * (1280 / 980)).toBeCloseTo(1);
    expect(coordinateScale(0.5)).toBe(2);
  });

  it('falls back to 1 for a scale that is not usable', () => {
    expect(coordinateScale(0)).toBe(1);
    expect(coordinateScale(-1)).toBe(1);
    expect(coordinateScale(NaN)).toBe(1);
  });
});
