import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { Nav } from '../lib/nav';
import { Ui } from '../lib/ui-state';
import { Thumbnail } from './thumbnail';

// The slide overview (key `o`, Slidev's QuickOverview): every slide as a live thumbnail.
// Click a card to go there. Arrows move the highlight, Enter goes, Escape closes (see shortcuts.ts).
@Component({
  selector: 'app-overview',
  imports: [Thumbnail],
  host: { '(window:resize)': 'measure()' },
  template: `
    @if (ui.overview()) {
      <div id="overview" class="fixed inset-0 z-modal bg-main bg-opacity-75! p-16 py-20 overflow-y-auto backdrop-blur-5px select-none text-main" (click)="close()">
        <div class="grid gap-y-4 gap-x-8 w-full" [style.grid-template-columns]="'repeat(auto-fit, minmax(' + cardWidth + 'px, 1fr))'">
          @for (slide of nav.slides; track $index) {
            <div class="relative">
              <div
                class="overview-card inline-block border rounded overflow-hidden bg-main hover:border-primary transition cursor-pointer"
                [class]="ui.overviewPage() === $index + 1 ? 'border-primary' : 'border-main'"
                [attr.data-no]="$index + 1"
                (click)="go($index + 1, $event)"
              >
                @defer (on viewport) {
                  <app-thumbnail [no]="$index + 1" [width]="cardWidth" />
                } @placeholder {
                  <div [style.width.px]="cardWidth" [style.height.px]="cardWidth * 9 / 16"></div>
                }
              </div>
              <div class="absolute top-0 opacity-50" [style.left.px]="cardWidth + 5">{{ $index + 1 }}</div>
            </div>
          }
        </div>
      </div>
      <button id="overview-close" type="button" class="slidev-icon-btn fixed top-4 right-4 z-modal text-gray-400 text-2xl" title="Close" (click)="close()">
        <div class="i-carbon:close"></div>
      </button>
    }
  `,
})
export class Overview {
  protected ui = inject(Ui);
  protected nav = inject(Nav);
  protected width = signal(window.innerWidth);
  protected cardWidth = 300;

  constructor() {
    effect(() => {
      // Every time the overview opens, highlight the slide on screen, and tell the keys how wide a row is.
      if (!this.ui.overview()) return;
      untracked(() => {
        this.ui.overviewPage.set(this.nav.no());
        this.ui.overviewColumns.set(Math.max(1, Math.floor((this.width() - 128) / (this.cardWidth + 32))));
      });
    });
  }

  measure() { this.width.set(window.innerWidth); }

  close() { this.ui.overview.set(false); }

  go(no: number, e: Event) {
    e.stopPropagation(); // the backdrop would close the overview a second time
    this.nav.go(no);
    this.close();
  }
}
