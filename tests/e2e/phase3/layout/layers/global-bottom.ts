import { Component } from '@angular/core';
// Test layer (copied to src/app/layers while the layout deck is built): a small label that says where it is.
// Test layer: a small label that says where it is.
@Component({
  selector: 'test-global-bottom',
  template:
    '<div id="gb" style="position:absolute;bottom:4px;left:4px;pointer-events:auto" [attr.data-slide]="no">global-bottom</div>',
})
export default class GlobalBottomLayer {
  no = 0;
}
