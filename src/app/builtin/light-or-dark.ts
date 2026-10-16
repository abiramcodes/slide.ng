import { Component, inject } from '@angular/core';
import { Dark } from '../lib/dark';

// Shows one of two contents, depending on the colour mode:
//   <slide-ng-light-or-dark><div dark>for dark mode</div><div light>for light mode</div></slide-ng-light-or-dark>
@Component({
  selector: 'slide-ng-light-or-dark',
  template: `
    @if (dark.isDark()) {
      <ng-content select="[dark]" />
    } @else {
      <ng-content select="[light]" />
    }
  `,
})
export class LightOrDark {
  protected dark = inject(Dark);
}
