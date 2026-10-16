import { Component, input } from '@angular/core';

// A header across the top (default content), then left and right columns, then a bottom row.
// The grid itself is in layouts.css (.two-cols-header).
@Component({
  selector: 'sn-two-cols-header',
  host: { class: 'slidev-layout two-cols-header w-full h-full', '[class]': 'layoutClass()' },
  template: `
    <div class="col-header"><ng-content /></div>
    <div class="col-left" [class]="contentClass()"><ng-content select="[left]" /></div>
    <div class="col-right" [class]="contentClass()"><ng-content select="[right]" /></div>
    <div class="col-bottom" [class]="contentClass()"><ng-content select="[bottom]" /></div>
  `,
})
export class TwoColsHeaderLayout {
  layoutClass = input('');
  contentClass = input('');
}
