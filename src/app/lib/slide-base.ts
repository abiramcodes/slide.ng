import { inject } from '@angular/core';
import { ClicksContext } from './clicks';

/** Base class of every generated slide. */
export class SlideBase {
  // Provided by the generated slide's `providers`, so each slide has its own.
  clicks = inject(ClicksContext);
}
