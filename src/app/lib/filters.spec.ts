import { defaultFilters, filterCss } from './filters';

describe('filterCss', () => {
  it('is empty for the defaults', () => {
    expect(filterCss(defaultFilters)).toBe('');
  });
  it('lists only what changed, in a fixed order', () => {
    expect(filterCss({ ...defaultFilters, hue: 90, brightness: 120 })).toBe('brightness(120%) hue-rotate(90deg)');
    expect(filterCss({ brightness: 80, contrast: 110, saturate: 50, grayscale: 100, hue: 10 }))
      .toBe('brightness(80%) contrast(110%) saturate(50%) grayscale(100%) hue-rotate(10deg)');
  });
});
