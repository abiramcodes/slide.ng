import { Component } from '@angular/core';

// Everything centred, both ways.
@Component({
  selector: 'sn-center',
  host: { class: 'block w-full h-full' },
  template: `<div class="h-full box-border px-24 grid place-content-center text-center"><ng-content /></div>`,
})
export class CenterLayout {}
