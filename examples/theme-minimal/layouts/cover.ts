import { Component, computed, input } from '@angular/core';

// Replaces the built-in `cover` layout: a left-aligned title with a thin accent line under it.
// `background` is still read from the frontmatter (theme.json does not change the inputs of a layout that is replaced).
@Component({
  selector: 'minimal-cover',
  host: { class: 'slidev-layout minimal-cover', '[style]': 'style()' },
  template: '<div class="minimal-cover-body"><ng-content /></div><div class="minimal-cover-line"></div>',
})
export class MinimalCover {
  background = input('');
  style = computed(() => (this.background() ? `background:${this.background()}` : ''));
}
