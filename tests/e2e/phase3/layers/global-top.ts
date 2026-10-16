import { Component, inject } from '@angular/core';
import { SLIDE_NO } from '../lib/slide-context';
// Test layer (copied to src/app/layers while the layout deck is built): a small label that says where it is.
// Test layer: a small label that says where it is.
@Component({
  selector: 'test-global-top',
  template: '<div id="gt" style="position:absolute;top:4px;left:4px;pointer-events:auto" [attr.data-slide]="no">global-top</div>',
})
export default class GlobalTopLayer {
  no = 0;
}
