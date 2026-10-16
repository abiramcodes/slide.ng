import { Injectable, inject, signal } from '@angular/core';
import { storedSignal } from '../lib/stored-signal';
import { editorEnabled } from '../lib/switches';
import { DevApi } from './dev-api';

/** Is the side editor open, and is there a dev server to save to at all? */
@Injectable({ providedIn: 'root' })
export class SideEditorState {
  /** Remembered in the browser, because a rebuild after an edit can reload the page. */
  readonly open = storedSignal('slide-ng-editor-open', false);
  /** True once the companion server accepted us. A static build never gets there. */
  readonly available = signal(false);
  /** The page keeps this much room free on the right while the editor is open. */
  readonly width = 420;

  constructor() {
    const api = inject(DevApi);
    if (api.enabled && editorEnabled())
      void api.token().then((token) => this.available.set(!!token));
  }

  toggle() {
    this.open.update((v) => !v);
  }
}
