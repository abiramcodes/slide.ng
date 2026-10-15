// <v-clicks> makes each list item of its content appear on its own click.
// Options: depth="2" (nested lists), every="2" (items per click), at="3" (first click), hide.
import { Component, ElementRef, Injector, OnDestroy, OnInit, booleanAttribute, effect, inject, input } from '@angular/core';
import { ClicksContext, RawAt, RawSingleAt, normalizeSingle } from './clicks';
import { stateOf } from './v-click';

@Component({ selector: 'v-clicks', template: '<ng-content />', host: { style: 'display: contents' } })
export class VClicks implements OnInit, OnDestroy {
  depth = input<number | string>(1);
  every = input<number | string>(1);
  at = input<RawAt>('+1');
  hide = input(false, { transform: booleanAttribute });

  private ctx = inject(ClicksContext);
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private injector = inject(Injector);
  private keys: unknown[] = [];

  ngOnInit() {
    const every = +this.every(), depth = +this.depth();
    const at = normalizeSingle(this.at() as RawSingleAt);
    if (at == null) return;
    const relative = typeof at === 'string';

    // Document order is the same order Slidev walks the children.
    const items = Array.from(this.el.querySelectorAll('li')).filter((li) => this.listDepth(li) <= depth);

    let index = 1, previous = 0;
    for (const li of items) {
      const showAt = +at + Math.ceil(index++ / every) - 1;
      const delta = showAt - previous;
      previous = showAt;
      const info = this.ctx.calculate(relative ? (delta >= 0 ? `+${delta}` : `${delta}`) : showAt)!;
      this.ctx.register(li, info);
      this.keys.push(li);
      li.classList.add('slidev-vclick-target');
      const state = stateOf(this.ctx, () => info, () => this.hide());
      // The <li> elements are plain HTML, so we toggle their classes by hand.
      effect(() => {
        li.classList.toggle('slidev-vclick-hidden', state.hidden());
        li.classList.toggle('slidev-vclick-current', state.current());
        li.classList.toggle('slidev-vclick-prior', state.prior());
      }, { injector: this.injector });
    }

    // Slidev's "gap": reserve the rest of the clicks so later elements start after the list.
    const size = +at + Math.ceil((index - 1) / every) - 1 - previous;
    const gap = {};
    this.keys.push(gap);
    this.ctx.register(gap, { delta: size, max: this.ctx.currentOffset + size - 1 });
  }

  // How many <ul>/<ol> sit between this <li> and the <v-clicks> element.
  private listDepth(li: HTMLElement) {
    let depth = 0;
    for (let p = li.parentElement; p && p !== this.el; p = p.parentElement) {
      if (p.tagName === 'UL' || p.tagName === 'OL') depth++;
    }
    return depth;
  }

  ngOnDestroy() { this.keys.forEach((k) => this.ctx.unregister(k)); }
}
