import { Component, inject } from '@angular/core';
import { SLIDE_NO } from '../lib/slide-context';
// Test layer (copied to src/app/layers while the layout deck is built): a small label that says where it is.
// Test layer: a small label that says where it is.
@Component({
  selector: 'test-slide-top',
  template: '<div id="st" style="position:absolute;top:4px;right:4px;pointer-events:auto" [attr.data-slide]="no">slide-top</div>',
})
export default class SlideTopLayer {
  no = inject(SLIDE_NO);
}
