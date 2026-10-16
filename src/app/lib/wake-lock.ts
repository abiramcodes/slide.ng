import { Injectable, effect, signal } from '@angular/core';
import { HEADMATTER } from '../../slides/generated';
import { storedSignal } from './stored-signal';

/**
 * Keeps the screen awake while presenting (the browser's Screen Wake Lock).
 * The headmatter `wakeLock: true` turns it on until the user chooses otherwise in the settings.
 */
@Injectable({ providedIn: 'root' })
export class WakeLock {
  readonly supported = 'wakeLock' in navigator;
  readonly enabled = storedSignal('slidev-wake-lock', HEADMATTER['wakeLock'] === true);
  /** True while the browser really holds the lock. */
  readonly held = signal(false);
  private sentinel: WakeLockSentinel | null = null;

  constructor() {
    if (!this.supported) return;
    effect(() => {
      if (this.enabled()) void this.acquire();
      else void this.release();
    });
    // The browser drops the lock when the tab is hidden; ask again when it is back.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.enabled() && !this.sentinel)
        void this.acquire();
    });
  }

  private async acquire() {
    if (this.sentinel) return;
    try {
      const sentinel = await navigator.wakeLock.request('screen');
      sentinel.addEventListener('release', () => {
        this.sentinel = null;
        this.held.set(false);
      });
      this.sentinel = sentinel;
      this.held.set(true);
    } catch {
      /* refused (hidden tab, battery saver): the setting stays on, `held` stays false */
    }
  }

  private async release() {
    await this.sentinel?.release();
  }
}
