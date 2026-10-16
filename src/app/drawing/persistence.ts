// Drawings survive a reload: they are kept in localStorage, and the ones the generator found in
// `.slide-ng/drawings/` (when the deck has `drawings: { persist: true }`) are the starting point.
import { effect, inject } from '@angular/core';
import { DRAWINGS } from '../../slides/generated';
import { SyncState } from '../sync/sync-state';
import { DrawingsState, cleanDrawings } from '../sync/shared-state';

const KEY = 'slide-ng-drawings';

/** Drawings saved in this browser. Storage may be blocked, then there are none. */
export function readStored(): DrawingsState {
  try { return cleanDrawings(JSON.parse(localStorage.getItem(KEY) ?? '{}')); } catch { return {}; }
}

/** What to start with: the drawings baked in by the generator, then whatever this browser saved on top. */
export const initialDrawings = (): DrawingsState => ({ ...cleanDrawings(DRAWINGS), ...readStored() });

/** Fill the shared drawings once, and write every change to localStorage (a little later, drawing makes many changes). */
export function startPersistence(persist: boolean) {
  const sync = inject(SyncState);
  sync.drawings.update((d) => ({ ...initialDrawings(), ...d }));
  let timer: ReturnType<typeof setTimeout> | undefined;
  effect(() => {
    const state = sync.drawings();
    clearTimeout(timer);
    timer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* the drawing just is not remembered */ }
    }, 300);
  });
  void persist; // the dev server copy is added with the dev server (dev/dev-sync.ts)
}
