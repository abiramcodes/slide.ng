// Slides are drawn on a fixed-size canvas and scaled to fit the window.
// This keeps layouts identical on every screen (Slidev does the same).
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540; // 16:9

// Same formula as Slidev: the biggest scale where the whole canvas still fits.
export function fitScale(windowWidth: number, windowHeight: number): number {
  return Math.min(windowWidth / CANVAS_WIDTH, windowHeight / CANVAS_HEIGHT);
}
