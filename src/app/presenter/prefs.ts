import { Injectable } from '@angular/core';
import { storedSignal } from '../lib/stored-signal';

// What the presenter changes about its own page, remembered in the browser (Slidev's keys).
@Injectable({ providedIn: 'root' })
export class PresenterPrefs {
  /** 1, 2 or 3: the three arrangements of current slide, notes and next step. */
  readonly layout = storedSignal('slidev-presenter-layout', 1);
  /** Font size of the notes, in em. */
  readonly fontSize = storedSignal('slidev-presenter-font-size', 1);

  nextLayout() { this.layout.update((l) => (l >= 3 ? 1 : l + 1)); }
  bigger() { this.fontSize.update((s) => Math.min(2, Math.round((s + 0.1) * 10) / 10)); }
  smaller() { this.fontSize.update((s) => Math.max(0.5, Math.round((s - 0.1) * 10) / 10)); }
}
