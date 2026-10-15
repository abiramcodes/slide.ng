import { CANVAS_HEIGHT, CANVAS_WIDTH, fitScale } from './canvas';

describe('fitScale', () => {
  it('is 1 when the window is exactly the canvas size', () => {
    expect(fitScale(CANVAS_WIDTH, CANVAS_HEIGHT)).toBe(1);
  });
  it('scales by width when the window is narrower than 16:9', () => {
    expect(fitScale(CANVAS_WIDTH * 2, CANVAS_HEIGHT * 4)).toBe(2);
  });
  it('scales by height when the window is wider than 16:9', () => {
    expect(fitScale(CANVAS_WIDTH * 4, CANVAS_HEIGHT * 2)).toBe(2);
  });
});
