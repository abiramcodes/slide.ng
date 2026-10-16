import { Component, computed, input } from '@angular/core';
import { background } from './background';

// Title slide. `background` (colour or image) is dimmed so the title stays readable.
@Component({
  selector: 'sn-cover',
  host: { class: 'slidev-layout cover', '[style]': 'style()' },
  template: '<div class="my-auto w-full"><ng-content /></div>',
})
export class CoverLayout {
  background = input('');
  style = computed(() => background(this.background(), true));
}
