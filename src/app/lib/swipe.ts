// Touch swipes, with Slidev's thresholds (composables/useSwipeControls.ts): a swipe left or right of more than 30% of the window
// width or 75px goes to the next or previous click, an up or down swipe of more than 40% of the height or 200px to the next or previous slide.
export type SwipeAction = 'next' | 'prev' | 'nextSlide' | 'prevSlide';

/** What a finished swipe does. `dx` and `dy` are the distance from where the finger went down to where it was lifted. */
export function swipeAction(
  dx: number,
  dy: number,
  width: number,
  height: number,
): SwipeAction | null {
  const x = Math.abs(dx);
  const y = Math.abs(dy);
  if (x / width > 0.3 || x > 75) return dx < 0 ? 'next' : 'prev'; // the finger moved left: go forward
  if (y / height > 0.4 || y > 200) return dy > 0 ? 'prevSlide' : 'nextSlide'; // the finger moved down: go back
  return null;
}
