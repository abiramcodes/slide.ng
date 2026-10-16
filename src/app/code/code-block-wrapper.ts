// Wraps one highlighted code block (the generator puts Shiki's <pre> inside).
// Port of Slidev's CodeBlockWrapper: title bar, copy button, line numbers, maximum height and
// the line highlights, which can change with clicks: ```ts {2-3|5|all}
import { Component, ElementRef, OnDestroy, OnInit, afterRenderEffect, booleanAttribute, computed, inject, input, numberAttribute, signal } from '@angular/core';
import { CLICKS_MAX, ClickInfo, ClicksContext, RawSingleAt } from '../lib/clicks';
import { highlightLines, rangeAt } from './ranges';
import { copyText } from './copy';

@Component({
  selector: 'code-block-wrapper',
  host: {
    class: 'slidev-code-wrapper relative group',
    '[class.slidev-code-line-numbers]': 'lines()',
    '[class.active]': 'active()',
    '[style.max-height]': 'maxHeight()',
    '[style.overflow-y]': 'maxHeight() ? "scroll" : null',
    '[style.--start]': 'startLine()',
    '[attr.data-title]': 'title()',
  },
  template: `
    @if (title()) {
      <div class="slidev-code-block-title"><div class="leading-1em">{{ title() }}</div></div>
    }
    <ng-content />
    @if (!noCopy()) {
      <button class="slidev-code-copy absolute right-0 transition opacity-0 group-hover:opacity-20 hover:!opacity-100"
        [class]="title() ? 'top-10' : 'top-0'" [attr.title]="copied() ? 'Copied' : 'Copy'" (click)="copy()">
        <span [class]="copied() ? 'i-ph:check-circle' : 'i-ph:clipboard'" class="inline-block p-2 w-8 h-8"></span>
      </button>
    }
  `,
})
export class CodeBlockWrapper implements OnInit, OnDestroy {
  // "2-3|5|all": one range per click
  ranges = input<string[], string | undefined>([], { transform: (v) => (v ? v.split('|') : []) });
  finally = input('last');
  at = input<RawSingleAt>('+1');
  startLine = input(1, { transform: numberAttribute });
  lines = input(false, { transform: booleanAttribute });
  maxHeight = input<string>();
  title = input('');
  noCopy = input(false, { transform: booleanAttribute });
  /** set by a code group: the tab that is shown */
  active = signal(false);

  protected copied = signal(false);
  private clicks = inject(ClicksContext);
  private host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private info = signal<ClickInfo | null>(null);
  private shown = computed(() => {
    const info = this.info();
    const index = info ? Math.max(0, this.clicks.current() - info.start + 1) : CLICKS_MAX;
    const last = this.finally() === 'last' ? this.ranges().at(-1) ?? 'all' : this.finally();
    return rangeAt(this.ranges(), index, last);
  });

  constructor() {
    afterRenderEffect(() => {
      if (!this.ranges().length) return;
      const { text, hide } = this.shown();
      this.host.classList.toggle('slidev-vclick-hidden', hide);
      const lines = Array.from(this.host.querySelectorAll('.shiki code > .line')).map((el) => [el]);
      highlightLines(lines, text, this.startLine());
      if (this.maxHeight()) this.scrollToHighlight();
    });
  }

  // In template order, so that "+1" counts the elements before this one.
  ngOnInit() {
    if (!this.ranges().length) return;
    const info = this.clicks.calculateSince(this.at(), this.ranges().length - 1);
    this.info.set(info);
    this.clicks.register(this, info);
  }

  ngOnDestroy() { this.clicks.unregister(this); }

  // With a maximum height the block scrolls; keep the highlighted lines in view.
  private scrollToHighlight() {
    const lit = Array.from(this.host.querySelectorAll<HTMLElement>('.line.highlighted'));
    if (!lit.length) return;
    const height = lit.reduce((sum, el) => sum + el.offsetHeight, 0);
    const target = height > this.host.offsetHeight ? lit[0] : lit[Math.round((lit.length - 1) / 2)];
    target.scrollIntoView({ behavior: 'smooth', block: height > this.host.offsetHeight ? 'start' : 'center' });
  }

  protected async copy() {
    const text = this.host.querySelector('.slidev-code')?.textContent;
    if (!text || !(await copyText(text))) return;
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
