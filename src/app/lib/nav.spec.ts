import { findSlide } from './nav';

describe('findSlide', () => {
  const aliases = [null, 'intro', null];
  it('reads a number and keeps it between the first and the last slide', () => {
    expect(findSlide('2', 3, aliases)).toBe(2);
    expect(findSlide('99', 3, aliases)).toBe(3);
    expect(findSlide('0', 3, aliases)).toBe(1);
  });
  it('finds a slide by its routeAlias', () => {
    expect(findSlide('intro', 3, aliases)).toBe(2);
  });
  it('gives null when nothing matches', () => {
    expect(findSlide('nope', 3, aliases)).toBeNull();
  });
});
