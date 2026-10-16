// The canvas size from the headmatter, the same rule as the app (`src/app/lib/canvas.ts`) and Slidev:
// `canvasWidth` (default 980) and `aspectRatio` (default 16/9), height rounded up.
const DEFAULT_WIDTH = 980;
const DEFAULT_RATIO = 16 / 9;

function readRatio(value) {
  const text = String(value ?? '');
  const parts = text.split('/').map((p) => Number(p.trim()));
  const ratio = parts.length === 2 ? parts[0] / parts[1] : Number(text);
  return Number.isFinite(ratio) && ratio > 0.2 && ratio < 5 ? ratio : DEFAULT_RATIO;
}

export function canvasSize(headmatter = {}) {
  const w = Number(headmatter.canvasWidth);
  const width = Number.isFinite(w) && w >= 100 && w <= 10_000 ? Math.round(w) : DEFAULT_WIDTH;
  return { width, height: Math.ceil(width / readRatio(headmatter.aspectRatio)) };
}
