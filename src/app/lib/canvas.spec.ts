import { CANVAS_HEIGHT, CANVAS_WIDTH, fitScale, readCanvasSize, readZoom } from './canvas';

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

describe('readCanvasSize', () => {
  it('is 960 by 540 without settings', () => {
    expect(readCanvasSize({})).toEqual({ width: 960, height: 540 });
  });
  it('takes canvasWidth and an aspect ratio as number or fraction', () => {
    expect(readCanvasSize({ canvasWidth: 800, aspectRatio: '4/3' })).toEqual({ width: 800, height: 600 });
    expect(readCanvasSize({ canvasWidth: 1000, aspectRatio: 2 })).toEqual({ width: 1000, height: 500 });
    expect(readCanvasSize({ aspectRatio: '16 / 10' })).toEqual({ width: 960, height: 600 });
  });
  it('ignores values that make no sense', () => {
    expect(readCanvasSize({ canvasWidth: -5, aspectRatio: 'wide' })).toEqual({ width: 960, height: 540 });
    expect(readCanvasSize({ canvasWidth: 'x', aspectRatio: '1/0' })).toEqual({ width: 960, height: 540 });
  });
});

describe('readZoom', () => {
  it('prefers the slide over the headmatter', () => {
    expect(readZoom({ zoom: 0.5 }, { zoom: 0.8 })).toBe(0.5);
    expect(readZoom({}, { zoom: 0.8 })).toBe(0.8);
  });
  it('is 1 when missing or out of range', () => {
    expect(readZoom({}, {})).toBe(1);
    expect(readZoom({ zoom: 0 }, {})).toBe(1);
    expect(readZoom({ zoom: 'big' }, {})).toBe(1);
  });
});
