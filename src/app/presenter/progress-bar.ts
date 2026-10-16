import { Component, computed, input } from '@angular/core';

// The thin bar at the top of the presenter and notes pages (Slidev's CurrentProgressBar):
// one cell per slide, the current one filled by how far through its clicks we are.
@Component({
  selector: 'app-progress-bar',
  template: `
    <div class="relative flex gap-px">
      @for (i of cells(); track i) {
        <div
          class="border-x border-b border-main h-4px transition-all"
          [style.width.%]="100 / cells().length"
          [class]="i < current() ? 'bg-primary border-primary' : ''"
        >
          @if (i === current()) {
            <div class="h-full bg-primary op75 transition-all" [style.width.%]="fill()"></div>
          }
        </div>
      }
    </div>
  `,
})
export class ProgressBar {
  current = input.required<number>();
  clicks = input(0);
  clicksTotal = input(0);
  total = input.required<number>();
  // Slidev draws `total - 1` cells: the last slide has none.
  protected cells = computed(() =>
    Array.from({ length: Math.max(this.total() - 1, 1) }, (_, i) => i + 1),
  );
  protected fill = computed(() =>
    this.clicksTotal() === 0 ? 0 : (this.clicks() / (this.clicksTotal() + 1)) * 100,
  );
}
