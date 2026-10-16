import { Injectable } from '@angular/core';
import { Filters, defaultFilters } from './filters';
import { storedSignal } from './stored-signal';

/** What a viewer chooses about how slides look on their screen, remembered in the browser. */
@Injectable({ providedIn: 'root' })
export class ViewPrefs {
  readonly filters = storedSignal<Filters>('slidev-filters', defaultFilters);
}
