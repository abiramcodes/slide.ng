// Colour filters for the slides (Slidev's "slide filters" in the settings menu), as plain numbers.
export interface Filters {
  /** Percent: 100 is unchanged. */
  brightness: number;
  contrast: number;
  saturate: number;
  /** Percent, 0 is unchanged. */
  grayscale: number;
  /** Degrees. */
  hue: number;
}

export const defaultFilters: Filters = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  hue: 0,
};

/** The CSS `filter` value, or '' when nothing is changed (so the browser does no extra work). */
export function filterCss(f: Filters): string {
  const parts: string[] = [];
  if (f.brightness !== 100) parts.push(`brightness(${f.brightness}%)`);
  if (f.contrast !== 100) parts.push(`contrast(${f.contrast}%)`);
  if (f.saturate !== 100) parts.push(`saturate(${f.saturate}%)`);
  if (f.grayscale !== 0) parts.push(`grayscale(${f.grayscale}%)`);
  if (f.hue !== 0) parts.push(`hue-rotate(${f.hue}deg)`);
  return parts.join(' ');
}
