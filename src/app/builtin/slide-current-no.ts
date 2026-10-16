import { Component, inject } from '@angular/core';
import { SLIDE_NO } from '../lib/slide-context';

// <slide-current-no /> shows the number of the slide it is on.
@Component({ selector: 'slide-current-no', template: '{{ no }}' })
export class SlideCurrentNo {
  protected no = inject(SLIDE_NO);
}
