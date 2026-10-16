import { defaultFilters, filterCss } from './filters';

describe('filterCss', () => {
  it('is empty for the defaults', () => {
    expect(filterCss(defaultFilters)).toBe('');
  });
  it('lists only what changed, in a fixed order', () => {
    expect(filterCss({ ...defaultFilters, hueRotate: 90, brightness: 1.2 })).toBe(
      'brightness(1.2) hue-rotate(90deg)',
    );
    expect(
      filterCss({
        invert: true,
        brightness: 0.8,
        contrast: 1.1,
        saturate: 0.5,
        sepia: 1,
        hueRotate: 10,
      }),
    ).toBe('brightness(0.8) contrast(1.1) saturate(0.5) sepia(1) hue-rotate(10deg) invert(1)');
  });
});
