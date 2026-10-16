import { isDevMode } from '@angular/core';
import { HEADMATTER } from '../../slides/generated';

/**
 * The headmatter `record:` setting. `true` / `false`, or `dev` (default) / `build` to offer
 * camera and recording only while developing or only in the built deck, as in Slidev.
 */
export function readRecordConfig(headmatter: Record<string, unknown>, dev: boolean): boolean {
  const record = headmatter['record'];
  if (record === true || record === false) return record;
  return record === 'build' ? !dev : dev;
}

export const recordEnabled = (): boolean => readRecordConfig(HEADMATTER, isDevMode());
