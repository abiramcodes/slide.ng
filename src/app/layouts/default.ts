import { Component } from '@angular/core';

// The normal slide: padded, content from the top.
@Component({
  selector: 'sn-default',
  host: { class: 'block w-full h-full' },
  template: `<div class="h-full box-border px-24 py-16"><ng-content /></div>`,
})
export class DefaultLayout {}
