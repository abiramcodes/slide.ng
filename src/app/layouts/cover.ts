import { Component } from '@angular/core';

// Title slide: content centred vertically, text left-aligned.
@Component({
  selector: 'sn-cover',
  host: { class: 'block w-full h-full' },
  template: `<div class="h-full box-border px-24 flex flex-col justify-center"><ng-content /></div>`,
})
export class CoverLayout {}
