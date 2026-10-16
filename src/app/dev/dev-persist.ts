import { DevApi } from './dev-api';

/** Which slides' drawings differ between two states: slide number -> new markup, or '' when the drawing was cleared. */
export function changedDrawings(before: Record<number, string>, after: Record<number, string>): Record<number, string> {
  const changed: Record<number, string> = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const no = Number(key);
    if ((before[no] ?? '') !== (after[no] ?? '')) changed[no] = after[no] ?? '';
  }
  return changed;
}

/**
 * Writes the drawings that changed to `.slide-ng/drawings/` through the dev server (only with `drawings: { persist: true }`).
 * Returns the state that is now on disk, which the caller keeps for the next comparison.
 */
export async function saveDrawings(api: DevApi, onDisk: Record<number, string>, now: Record<number, string>): Promise<Record<number, string>> {
  const next = { ...onDisk };
  for (const [no, svg] of Object.entries(changedDrawings(onDisk, now))) {
    if (await api.send('PUT', `/drawings/${no}`, { svg })) {
      if (svg) next[Number(no)] = svg; else delete next[Number(no)];
    }
  }
  return next;
}
