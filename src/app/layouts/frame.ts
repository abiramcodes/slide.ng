import { Component, computed, inject, input, numberAttribute } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

// The web page box used by the iframe layouts. `scale` shrinks or grows the page inside it.
@Component({
  selector: 'sn-frame',
  host: { class: 'block relative', '[style.width]': 'size()', '[style.height]': 'size()' },
  template: '<iframe class="slidev-layout-iframe" [src]="src()" [style.--slidev-iframe-scale]="scale()"></iframe>',
})
export class Frame {
  url = input.required<string>();
  scale = input(undefined, { transform: numberAttribute });
  size = computed(() => `${(1 / (this.scale() || 1)) * 100}%`);
  // Angular refuses plain strings in an iframe src. The address comes from the deck author, so we trust it.
  src = computed(() => inject(DomSanitizer).bypassSecurityTrustResourceUrl(this.url()));
}
