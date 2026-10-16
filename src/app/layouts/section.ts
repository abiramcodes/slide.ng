import { Component } from '@angular/core';

// Marks the start of a new section.
@Component({
  selector: 'sn-section',
  host: { class: 'slidev-layout section w-full h-full grid' },
  template: '<div class="my-auto text-center"><ng-content /></div>',
})
export class SectionLayout {}
