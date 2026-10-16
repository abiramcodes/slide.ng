// The v-click directive: <div v-click>, <div v-click="3">, <div [v-click]="[2,4]">,
// <div v-after>, <div v-click-hide>. Port of Slidev's v-click / v-after directives.
import {
  Directive,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  signal,
  booleanAttribute,
} from '@angular/core';
import { ClickInfo, ClicksContext, RawAt } from './clicks';

/** Works out whether an element is hidden / current / prior (port of Slidev's class logic). */
export function stateOf(ctx: ClicksContext, info: () => ClickInfo | null, hide: () => boolean) {
  const active = computed(() => {
    const i = info();
    return !!i && i.isActive(ctx.current());
  });
  const current = computed(() => {
    const i = info();
    return !!i && i.isCurrent(ctx.current());
  });
  // `hide` flips the meaning: shown first, hidden once the click is reached.
  const hidden = computed(() => (info() ? (hide() ? active() : !active()) : false));
  return { hidden, current, prior: computed(() => active() && !current()) };
}

@Directive({
  selector: '[v-click], [v-after], [v-click-hide]',
  host: {
    '[class.slidev-vclick-target]': 'info() !== null',
    '[class.slidev-vclick-hidden]': 'state.hidden()',
    '[class.slidev-vclick-current]': 'state.current()',
    '[class.slidev-vclick-prior]': 'state.prior()',
    '[attr.data-slidev-clicks-start]': 'info()?.start',
    '[attr.data-slidev-clicks-end]': 'endAttr()',
  },
})
export class VClick implements OnInit, OnDestroy {
  at = input<RawAt>(undefined, { alias: 'v-click' });
  after = input(false, { alias: 'v-after', transform: booleanAttribute });
  hide = input(false, { alias: 'v-click-hide', transform: booleanAttribute });

  private ctx = inject(ClicksContext);
  info = signal<ClickInfo | null>(null);
  state = stateOf(
    this.ctx,
    () => this.info(),
    () => this.hide(),
  );
  endAttr = computed(() => {
    const e = this.info()?.end;
    return e != null && isFinite(e) ? e : null;
  });

  // Inputs are set before ngOnInit, and ngOnInit runs in template order.
  // That order is what makes relative clicks ("+1") work.
  ngOnInit() {
    const at = this.at() ?? (this.after() ? '+0' : undefined); // v-after = same click as the element before
    const info = this.ctx.calculate(at);
    this.info.set(info);
    this.ctx.register(this, info);
  }

  ngOnDestroy() {
    this.ctx.unregister(this);
  }
}
