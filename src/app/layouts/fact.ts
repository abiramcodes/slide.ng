import { Component } from '@angular/core';

// One big fact or number.
@Component({
  selector: 'sn-fact',
  host: { class: 'slidev-layout fact' },
  template: '<div class="my-auto"><ng-content /></div>',
})
export class FactLayout {}
