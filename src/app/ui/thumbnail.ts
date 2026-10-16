import { Component, ViewContainerRef, computed, effect, input, untracked, viewChild } from '@angular/core';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../lib/canvas';
import { CLICKS_MAX } from '../lib/clicks';
import { mountSlide } from '../lib/mount-slide';

// One overview card: the real slide component, drawn at its last click and scaled down to `width`.
@Component({
  selector: 'app-thumbnail',
  host: { class: 'block overflow-hidden relative pointer-events-none', '[style.width.px]': 'width()', '[style.height.px]': 'height()' },
  template: `<div class="bg-main text-main absolute top-0 left-0 overflow-hidden origin-top-left" [style]="style()"><ng-container #host /></div>`,
})
export class Thumbnail {
  no = input.required<number>();
  width = input(300);
  private host = viewChild.required('host', { read: ViewContainerRef });

  protected height = computed(() => (this.width() * CANVAS_HEIGHT) / CANVAS_WIDTH);
  protected style = computed(() => {
    const scale = this.width() / CANVAS_WIDTH;
    return { width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px`, transform: `scale(${scale})`, '--slidev-slide-scale': scale };
  });

  constructor() {
    effect(() => {
      const no = this.no(), host = this.host();
      untracked(() => {
        host.clear();
        // Asking for too many clicks shows the final state: the slide clamps the number.
        mountSlide(host, no, 'overview').instance.clicks.setCurrent(CLICKS_MAX);
      });
    });
  }
}
