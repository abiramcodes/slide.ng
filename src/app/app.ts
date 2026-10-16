import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WakeLock } from './lib/wake-lock';

@Component({ selector: 'app-root', imports: [RouterOutlet], template: '<router-outlet />' })
export class App {
  // Created here so the wake lock works from the first page, not only once the settings menu is opened.
  private wake = inject(WakeLock);
}
