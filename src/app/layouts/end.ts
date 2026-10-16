import { Component } from '@angular/core';

// The last slide. Shows END when the slide has no content.
@Component({
  selector: 'sn-end',
  host: { class: 'slidev-layout end' },
  template: '<ng-content>END</ng-content>',
})
export class EndLayout {}
