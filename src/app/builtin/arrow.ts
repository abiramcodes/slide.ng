// A simple arrow:  <arrow x1="10" y1="20" x2="100" y2="200" color="green" width="3" two-way />
// Port of Slidev's Arrow.vue (without its drag events). The svg is placed at the top left of the slide.
import { Component, booleanAttribute, input } from '@angular/core';

let counter = 0;

@Component({
  selector: 'arrow',
  host: { class: 'absolute left-0 top-0 pointer-events-none' },
  template: `
    <svg [attr.width]="Math.max(+x1(), +x2()) + 50" [attr.height]="Math.max(+y1(), +y2()) + 50">
      <defs>
        <marker [id]="id" markerWidth="10" refX="9" markerUnits="strokeWidth" markerHeight="7" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" [attr.fill]="color() || 'currentColor'" />
        </marker>
        @if (twoWay()) {
          <marker [id]="id + '-rev'" markerWidth="20" refX="11" markerUnits="strokeWidth" markerHeight="7" refY="3.5" orient="auto">
            <polygon points="20 0, 10 3.5, 20 7" [attr.fill]="color() || 'currentColor'" />
          </marker>
        }
      </defs>
      <line
        [attr.x1]="x1()" [attr.y1]="y1()" [attr.x2]="x2()" [attr.y2]="y2()"
        [attr.stroke]="color() || 'currentColor'" [attr.stroke-width]="width() || 2"
        [attr.marker-end]="'url(#' + id + ')'" [attr.marker-start]="twoWay() ? 'url(#' + id + '-rev)' : 'none'"
      />
    </svg>
  `,
})
export class Arrow {
  x1 = input.required<number | string>();
  y1 = input.required<number | string>();
  x2 = input.required<number | string>();
  y2 = input.required<number | string>();
  width = input<number | string>();
  color = input<string>();
  twoWay = input(false, { alias: 'two-way', transform: booleanAttribute });

  protected Math = Math;
  // Markers are found by id, so every arrow needs its own.
  protected id = `slide-arrow-${++counter}`;
}
