import { Component } from '@angular/core';

// Two columns. The generator wraps everything after `::right::` in <div right>,
// which lands in the second column. Everything before it is the first column.
@Component({
  selector: 'sn-two-cols',
  host: { class: 'block w-full h-full' },
  template: `
    <div class="h-full box-border px-24 py-16 grid grid-cols-2 gap-12">
      <div><ng-content /></div>
      <div><ng-content select="[right]" /></div>
    </div>
  `,
})
export class TwoColsLayout {}
