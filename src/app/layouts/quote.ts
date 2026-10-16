import { Component } from '@angular/core';

// A quotation with prominence.
@Component({
  selector: 'sn-quote',
  host: { class: 'slidev-layout quote' },
  template: '<div class="my-auto"><ng-content /></div>',
})
export class QuoteLayout {}
