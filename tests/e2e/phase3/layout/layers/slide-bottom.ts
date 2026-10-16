import { Component, inject } from '@angular/core';
import { SLIDE_NO } from 'slide-ng/lib/slide-context';
// Test layer (copied to src/app/layers while the layout deck is built): a small label that says where it is.
// Test layer: a small label that says where it is.
@Component({
  selector: 'test-slide-bottom',
  template: '<div id="sb" style="position:absolute;bottom:4px;right:4px;pointer-events:auto" [attr.data-slide]="no">slide-bottom</div>',
})
export default class SlideBottomLayer {
  no = inject(SLIDE_NO);
}
