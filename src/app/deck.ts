import { Component, ViewContainerRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CANVAS_HEIGHT, CANVAS_WIDTH, fitScale } from './lib/canvas';
import { ClicksContext } from './lib/clicks';
import { HEADMATTER, SLIDES } from '../slides/generated';

// Shows one slide per route (/:no). Arrow keys step through clicks, then slides.
@Component({
  selector: 'app-deck',
  host: { '(window:keydown)': 'key($event)', '(window:resize)': 'measure()' },
  template: `
    <div class="stage">
      <div class="canvas" [style.width.px]="width" [style.height.px]="height" [style.transform]="transform()">
        <ng-container #host />
      </div>
    </div>
    <div id="hud">slide {{ no() }}/{{ total }} clicks {{ ctx()?.current() }}/{{ ctx()?.total() }}</div>
  `,
})
export class Deck {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private host = viewChild.required('host', { read: ViewContainerRef });
  private params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });

  readonly width = CANVAS_WIDTH;
  readonly height = CANVAS_HEIGHT;
  readonly total = SLIDES.length;
  private windowSize = signal({ w: window.innerWidth, h: window.innerHeight });
  transform = computed(() => `translate(-50%, -50%) scale(${fitScale(this.windowSize().w, this.windowSize().h)})`);

  // Slide number from the URL, kept between 1 and the last slide.
  no = computed(() => Math.min(Math.max(+(this.params().get('no') ?? 1) || 1, 1), this.total));
  ctx = signal<ClicksContext | null>(null); // clicks of the slide on screen

  constructor() {
    // A new slide component per slide number, so each slide gets a fresh ClicksContext.
    effect(() => {
      const slide = SLIDES[this.no() - 1], host = this.host();
      if (!slide) return;
      untracked(() => {
        host.clear();
        const clicks = host.createComponent(slide.component).instance.clicks;
        const wanted = new URLSearchParams(location.search).get('clicks');
        if (wanted != null) clicks.setCurrent(+wanted || 0); // clamped once the slide is mounted
        this.ctx.set(clicks);
        const deckTitle = HEADMATTER['title'];
        document.title = [slide.title, deckTitle].filter((t, i, all) => t && all.indexOf(t) === i).join(' - ') || 'slide.ng';
      });
    });
    // Keep ?clicks= in the URL up to date so a reload or shared link lands on the same click.
    effect(() => {
      const clicks = this.ctx();
      if (!clicks || !clicks.mounted()) return;
      const url = new URL(location.href);
      url.searchParams.set('clicks', String(clicks.current()));
      history.replaceState(null, '', url);
    });
  }

  measure() { this.windowSize.set({ w: window.innerWidth, h: window.innerHeight }); }

  private go(no: number, clicks: number) { this.router.navigate(['/', no], { queryParams: { clicks } }); }

  key(e: KeyboardEvent) {
    const clicks = this.ctx(), no = this.no();
    if (!clicks) return;
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) {
      if (clicks.current() < clicks.total()) clicks.next();
      else if (no < this.total) this.go(no + 1, clicks.clicksStart); // next slide, at its first click
    } else if (['ArrowLeft', 'PageUp'].includes(e.key)) {
      if (clicks.current() > clicks.clicksStart) clicks.prev();
      else if (no > 1) this.go(no - 1, 9999); // previous slide, at its last click (clamped)
    }
  }
}
