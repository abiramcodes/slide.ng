import { Component } from '@angular/core';

// Replaces the built-in `quote` layout: large italic text with a bar at the left.
@Component({
  selector: 'minimal-quote',
  host: { class: 'slidev-layout minimal-quote' },
  template: '<div class="minimal-quote-body"><ng-content /></div>',
})
export class MinimalQuote {}
