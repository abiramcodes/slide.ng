import { Component } from '@angular/core';

// Content uses the whole screen, no padding.
@Component({
  selector: 'sn-full',
  host: { class: 'slidev-layout full w-full h-full' },
  template: '<ng-content />',
})
export class FullLayout {}
