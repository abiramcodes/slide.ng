// Colour filters for the slides (Slidev's "viewer CSS filter" in the settings menu), as plain numbers.
export interface Filters {
  invert: boolean;
  /** 1 is unchanged. */
  brightness: number;
  contrast: number;
  saturate: number;
  /** 0 is unchanged. */
  sepia: number;
  /** Degrees. */
  hueRotate: number;
}

export const defaultFilters: Filters = {
  invert: false,
  brightness: 1,
  contrast: 1,
  saturate: 1,
  sepia: 0,
  hueRotate: 0,
};

/** The CSS `filter` value, or '' when nothing is changed (so the browser does no extra work). */
export function filterCss(f: Filters): string {
  const parts: string[] = [];
  if (f.brightness !== 1) parts.push(`brightness(${f.brightness})`);
  if (f.contrast !== 1) parts.push(`contrast(${f.contrast})`);
  if (f.saturate !== 1) parts.push(`saturate(${f.saturate})`);
  if (f.sepia > 0) parts.push(`sepia(${f.sepia})`);
  if (f.hueRotate !== 0) parts.push(`hue-rotate(${f.hueRotate}deg)`);
  if (f.invert) parts.push('invert(1)');
  return parts.join(' ');
}
