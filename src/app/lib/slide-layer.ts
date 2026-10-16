import { Component, computed, input } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { LAYERS } from '../../slides/generated/layers';

// Shows one of the deck's layer components (src/app/layers/*.ts): `global-top` and `global-bottom` once
// over or under all slides, `slide-top` and `slide-bottom` inside every slide. The layer covers the slide
// but lets clicks through; give your own elements `pointer-events: auto` if they need the mouse.
@Component({
  selector: 'app-slide-layer',
  imports: [NgComponentOutlet],
  host: { style: 'position: absolute; inset: 0; pointer-events: none; display: block' },
  template: `@if (component(); as c) {
    <ng-container *ngComponentOutlet="c" />
  }`,
})
export class SlideLayer {
  name = input.required<'global-top' | 'global-bottom' | 'slide-top' | 'slide-bottom'>();
  protected component = computed(() => LAYERS[this.name()]);
}
