import { Component, input, numberAttribute } from '@angular/core';
import { Frame } from './frame';

// Web page on the right, content on the left. `contentClass` is the frontmatter `class`.
@Component({
  selector: 'sn-iframe-right',
  imports: [Frame],
  host: { class: 'grid grid-cols-2 w-full h-full' },
  template: `
    <div class="slidev-layout default" [class]="contentClass()"><ng-content /></div>
    <sn-frame [url]="url()" [scale]="scale()" />
  `,
})
export class IframeRightLayout {
  url = input.required<string>();
  scale = input(undefined, { transform: numberAttribute });
  contentClass = input('');
}
