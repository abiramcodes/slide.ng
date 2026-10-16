import { Component } from '@angular/core';

// A statement as the main content.
@Component({
  selector: 'sn-statement',
  host: { class: 'slidev-layout statement' },
  template: '<div class="my-auto"><ng-content /></div>',
})
export class StatementLayout {}
