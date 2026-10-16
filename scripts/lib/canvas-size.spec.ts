import { canvasSize } from './canvas-size.mjs';

describe('canvasSize', () => {
  it('is Slidev default: 980 wide, 16/9, height rounded up', () => {
    expect(canvasSize({})).toEqual({ width: 980, height: 552 });
  });
  it('reads canvasWidth and aspectRatio', () => {
    expect(canvasSize({ canvasWidth: 800, aspectRatio: '4/3' })).toEqual({
      width: 800,
      height: 600,
    });
  });
  it('ignores nonsense', () => {
    expect(canvasSize({ canvasWidth: -1, aspectRatio: 'x' })).toEqual({ width: 980, height: 552 });
  });
});
