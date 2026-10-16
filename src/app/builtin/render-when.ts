import { Component, computed, inject, input } from '@angular/core';
import { RENDER_CONTEXT } from '../lib/slide-context';

// Shows its content only where the slide is drawn: slide, presenter, print or overview.
// `main` means slide or presenter. Content marked `fallback` is shown everywhere else.
//   <render-when context="slide">only on the real slide<div fallback>thumbnail</div></render-when>
@Component({
  selector: 'render-when',
  template: `
    @if (show()) {
      <ng-content />
    } @else {
      <ng-content select="[fallback]" />
    }
  `,
})
export class RenderWhen {
  context = input.required<string | string[]>();
  private current = inject(RENDER_CONTEXT);

  protected show = computed(() => {
    const wanted = [this.context()].flat();
    return wanted.some((w) => w === this.current || (w === 'main' && ['slide', 'presenter'].includes(this.current)));
  });
}
