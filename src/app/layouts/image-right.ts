import { Component, computed, input } from '@angular/core';
import { background } from './background';

// Image on the right, content on the left. `contentClass` is the frontmatter `class`.
@Component({
  selector: 'sn-image-right',
  host: { class: 'grid grid-cols-2 w-full h-full auto-rows-fr' },
  template: `
    <div class="slidev-layout default" [class]="contentClass()"><ng-content /></div>
    <div class="w-full h-full" [style]="style()"></div>
  `,
})
export class ImageRightLayout {
  image = input('');
  contentClass = input('');
  backgroundSize = input('cover');
  style = computed(() => background(this.image(), false, this.backgroundSize()));
}
