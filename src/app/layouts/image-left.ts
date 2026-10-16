import { Component, computed, input } from '@angular/core';
import { background } from './background';

// Image on the left, content on the right. `contentClass` is the frontmatter `class`.
@Component({
  selector: 'sn-image-left',
  host: { class: 'grid grid-cols-2 w-full h-full auto-rows-fr' },
  template: `
    <div class="w-full h-full" [style]="style()"></div>
    <div class="slidev-layout default" [class]="contentClass()"><ng-content /></div>
  `,
})
export class ImageLeftLayout {
  image = input('');
  contentClass = input('');
  backgroundSize = input('cover');
  style = computed(() => background(this.image(), false, this.backgroundSize()));
}
