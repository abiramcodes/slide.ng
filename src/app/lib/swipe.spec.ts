import { describe, expect, it } from 'vitest';
import { swipeAction } from './swipe';

describe('swipeAction', () => {
  it('goes forward on a long swipe to the left and back on one to the right', () => {
    expect(swipeAction(-100, 0, 1000, 600)).toBe('next');
    expect(swipeAction(100, 0, 1000, 600)).toBe('prev');
  });
  it('counts 30% of a narrow window as long', () => expect(swipeAction(-40, 0, 100, 600)).toBe('next'));
  it('goes to the next slide on an upward swipe and the previous one on a downward swipe', () => {
    expect(swipeAction(0, -250, 1000, 600)).toBe('nextSlide');
    expect(swipeAction(0, 250, 1000, 600)).toBe('prevSlide');
  });
  it('ignores a short swipe', () => {
    expect(swipeAction(-50, 20, 1000, 600)).toBeNull();
    expect(swipeAction(0, 150, 1000, 600)).toBeNull();
  });
});
