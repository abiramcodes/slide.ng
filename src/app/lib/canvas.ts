import { HEADMATTER } from '../../slides/generated';

// Slides are drawn on a fixed-size canvas and scaled to fit the window.
// This keeps layouts identical on every screen (Slidev does the same).

const DEFAULT_WIDTH = 980;
const DEFAULT_RATIO = 16 / 9;

/** `16/9`, `'16/9'`, `'4 / 3'` or a plain number; anything unusable gives the default. */
function readRatio(value: unknown): number {
  const text = String(value ?? '');
  const parts = text.split('/').map((p) => Number(p.trim()));
  const ratio = parts.length === 2 ? parts[0] / parts[1] : Number(text);
  return Number.isFinite(ratio) && ratio > 0.2 && ratio < 5 ? ratio : DEFAULT_RATIO;
}

/** The canvas size from the headmatter's `canvasWidth` (default 980, like Slidev) and `aspectRatio` (default 16/9). */
export function readCanvasSize(headmatter: Record<string, unknown>): { width: number; height: number } {
  const w = Number(headmatter['canvasWidth']);
  const width = Number.isFinite(w) && w >= 100 && w <= 10_000 ? Math.round(w) : DEFAULT_WIDTH;
  // Height rounds up, as in Slidev, so a printed page never gets a blank extra page.
  return { width, height: Math.ceil(width / readRatio(headmatter['aspectRatio'])) };
}

/** The `zoom` of a slide: its own frontmatter first, then the headmatter. 1 when missing or unusable. */
export function readZoom(frontmatter: Record<string, unknown>, headmatter: Record<string, unknown>): number {
  const z = Number(frontmatter['zoom'] ?? headmatter['zoom'] ?? 1);
  return Number.isFinite(z) && z >= 0.1 && z <= 5 ? z : 1;
}

export const CANVAS_WIDTH = readCanvasSize(HEADMATTER).width;
export const CANVAS_HEIGHT = readCanvasSize(HEADMATTER).height;

// Same formula as Slidev: the biggest scale where the whole canvas still fits.
export function fitScale(windowWidth: number, windowHeight: number): number {
  return Math.min(windowWidth / CANVAS_WIDTH, windowHeight / CANVAS_HEIGHT);
}
