// Scales (or just moves the origin of) what is inside:  <transform scale="0.5" origin="top center">...</transform>
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'transform',
  host: { '[style.transform]': 'transform()', '[style.transform-origin]': 'origin() || "top left"', style: 'display: block' },
  template: '<ng-content />',
})
export class Transform {
  scale = input<number | string>();
  origin = input<string>();
  protected transform = computed(() => (this.scale() != null ? `scale(${this.scale() || 1})` : ''));
}
