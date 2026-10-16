import { Injectable, signal } from '@angular/core';

// Fullscreen on/off. `isFullscreen` follows the browser, so the Escape key (which the browser
// handles itself) keeps the buttons right too.
@Injectable({ providedIn: 'root' })
export class Fullscreen {
  readonly isFullscreen = signal(!!document.fullscreenElement);

  constructor() {
    document.addEventListener('fullscreenchange', () => this.isFullscreen.set(!!document.fullscreenElement));
  }

  toggle() {
    // The browser may refuse (no user gesture, iframe); nothing useful to do then.
    const done = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    done.catch(() => {});
  }
}
