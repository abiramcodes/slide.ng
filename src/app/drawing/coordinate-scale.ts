/** drauu multiplies mouse offsets (screen pixels) by this to get slide pixels. */
export function coordinateScale(canvasScale: number): number {
  return Number.isFinite(canvasScale) && canvasScale > 0 ? 1 / canvasScale : 1;
}
