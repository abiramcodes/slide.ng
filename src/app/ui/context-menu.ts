import { Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Fullscreen } from '../lib/fullscreen';
import { Nav } from '../lib/nav';
import { Ui } from '../lib/ui-state';

// The right-click menu (Slidev's ContextMenu): four arrows, then a list of actions.
// The drawing entry is still a placeholder (see the drawing phase).
@Component({
  selector: 'app-context-menu',
  host: {
    '(document:mousedown)': 'onMouseDown($event)',
    '(document:click)': 'onClickOutside($event)',
    '(window:blur)': 'ui.contextMenu.set(null)',
  },
  template: `
    @if (ui.contextMenu(); as at) {
      <div
        #menu
        id="context-menu"
        class="slidev-glass-effect fixed z-context-menu w-60 flex flex-wrap justify-items-start p-1 rounded-md shadow overflow-hidden select-none text-main"
        [style.left.px]="left()"
        [style.top.px]="top()"
        (contextmenu)="$event.preventDefault()"
        (click)="ui.contextMenu.set(null)"
      >
        @for (a of arrows(); track a.title) {
          <div
            class="menu-small p-2 w-[40px] h-[40px] text-center cursor-pointer rounded flex"
            [class]="a.disabled ? 'op40' : 'hover:bg-active'"
            [title]="a.title"
            (click)="a.run()"
          >
            <div [class]="a.icon + ' text-1.2em m-auto'"></div>
          </div>
        }
        <div class="w-full my-1 border-t border-main"></div>
        @for (item of items(); track item.label) {
          <div class="slidev-menu-item w-full" [class.disabled]="item.disabled" (click)="item.run()">
            <div class="mx-auto flex"><div [class]="item.icon + ' text-1.2em m-auto'"></div></div>
            <div>{{ item.label }}</div>
          </div>
        }
        <div class="w-full my-1 border-t border-main"></div>
        <div class="w-full text-xs p-2 opacity-50">
          Hold <kbd class="border px-1 py-0.5 border-main rounded text-primary">Shift</kbd> and right click to open the native context menu
        </div>
      </div>
    }
  `,
})
export class ContextMenu {
  protected ui = inject(Ui);
  private nav = inject(Nav);
  private fullscreen = inject(Fullscreen);
  private menu = viewChild<ElementRef<HTMLElement>>('menu');

  protected arrows = computed(() => [
    { icon: 'i-carbon:arrow-left', title: 'Previous Click', run: () => this.nav.prev(), disabled: !this.nav.hasPrev() },
    { icon: 'i-carbon:arrow-right', title: 'Next Click', run: () => this.nav.next(), disabled: !this.nav.hasNext() },
    { icon: 'i-carbon:arrow-up', title: 'Previous Slide', run: () => this.nav.prevSlide(), disabled: this.nav.no() <= 1 },
    { icon: 'i-carbon:arrow-down', title: 'Next Slide', run: () => this.nav.nextSlide(), disabled: this.nav.no() >= this.nav.total },
  ]);

  protected items = computed(() => [
    { icon: 'i-carbon:pen', label: 'Show drawing toolbar', run: () => {}, disabled: true }, // phase 3
    { icon: 'i-carbon:apps', label: 'Show slide overview', run: () => this.ui.toggleOverview(), disabled: false },
    this.nav.isPresenter
      ? { icon: 'i-carbon:presentation-file', label: 'Exit Presenter Mode', run: () => this.nav.exitPresenter(), disabled: false }
      : { icon: 'i-carbon:user-speaker', label: 'Enter Presenter Mode', run: () => this.nav.enterPresenter(), disabled: false },
    {
      icon: this.fullscreen.isFullscreen() ? 'i-carbon:minimize' : 'i-carbon:maximize',
      label: this.fullscreen.isFullscreen() ? 'Close fullscreen' : 'Enter fullscreen',
      run: () => this.fullscreen.toggle(),
      disabled: false,
    },
  ]);

  // Keep the menu inside the window: if it would stick out, move it back by the overflow.
  private size = signal({ width: 0, height: 0 });
  protected left = computed(() => this.fit(this.ui.contextMenu()?.x ?? 0, this.size().width, window.innerWidth));
  protected top = computed(() => this.fit(this.ui.contextMenu()?.y ?? 0, this.size().height, window.innerHeight));
  private fit = (pos: number, size: number, max: number) => (pos + size > max ? max - size : pos);

  constructor() {
    // Measure the menu once it is on screen.
    effect(() => {
      const el = this.menu()?.nativeElement;
      this.size.set({ width: el?.offsetWidth ?? 0, height: el?.offsetHeight ?? 0 });
    });
  }

  // Another right-click anywhere closes the menu (the new one opens after).
  onMouseDown(e: MouseEvent) {
    if (e.buttons & 2) this.ui.contextMenu.set(null);
  }

  onClickOutside(e: MouseEvent) {
    const menu = this.menu()?.nativeElement;
    if (menu && !menu.contains(e.target as Node)) this.ui.contextMenu.set(null);
  }
}
