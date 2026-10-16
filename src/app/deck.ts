import { Component, ElementRef, ViewContainerRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { NotFoundLayout } from './layouts/404';
import { CANVAS_HEIGHT, CANVAS_WIDTH, fitScale } from './lib/canvas';
import { Dark } from './lib/dark';
import { Fullscreen } from './lib/fullscreen';
import { hideIdleCursor } from './lib/idle-cursor';
import { Nav } from './lib/nav';
import { makeActions } from './lib/actions';
import { SHORTCUTS_SETUP, defaultShortcuts, findShortcut } from './lib/shortcuts';
import { Stage } from './lib/stage';
import { pickTransition } from './lib/transitions';
import { Ui } from './lib/ui-state';
import { ContextMenu } from './ui/context-menu';
import { Goto } from './ui/goto';
import { InfoDialog } from './ui/info-dialog';
import { NavBar } from './ui/nav-bar';
import { Overview } from './ui/overview';
import { HEADMATTER } from '../slides/generated';

// Is the user typing somewhere? Then letters are text, not shortcuts.
// Keys typed into a text field or a Monaco editor (its input is a plain div) are not shortcuts.
const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest('.monaco-editor') !== null);

// The route /:no. Shows one slide on a scaled canvas and hosts the controls around it.
@Component({
  selector: 'app-deck',
  imports: [NavBar, Overview, Goto, InfoDialog, ContextMenu, NotFoundLayout],
  providers: [Nav, Ui],
  host: { '(window:keydown)': 'key($event)', '(window:resize)': 'measure()' },
  template: `
    <div
      #stage
      id="slide-container"
      class="stage"
      [class.slidev-nav-go-forward]="nav.direction() > 0"
      [class.slidev-nav-go-backward]="nav.direction() < 0"
      (pointerdown)="stageClick($event)"
      (contextmenu)="contextMenu($event)"
    >
      <div #canvas id="slide-content" class="canvas" [style.width.px]="width" [style.height.px]="height" [style]="canvasStyle()">
        <ng-container #host />
        @if (nav.notFound()) { <sn-404 /> }
      </div>
      <div class="absolute bottom-0 left-0 p-2 transition duration-300 opacity-0 hover:opacity-100 focus-within:opacity-100">
        <app-nav-bar />
      </div>
    </div>
    <app-overview />
    <app-goto />
    <app-info-dialog />
    <app-context-menu />
    <div id="hud">slide {{ nav.no() }}/{{ nav.total }} clicks {{ nav.clicks() }}/{{ nav.clicksTotal() }}</div>
  `,
})
export class Deck {
  protected nav = inject(Nav);
  private ui = inject(Ui);
  private dark = inject(Dark);
  private fullscreen = inject(Fullscreen);
  private host = viewChild.required('host', { read: ViewContainerRef });
  private canvas = viewChild.required<ElementRef<HTMLElement>>('canvas');
  private stageEl = viewChild.required<ElementRef<HTMLElement>>('stage');

  readonly width = CANVAS_WIDTH;
  readonly height = CANVAS_HEIGHT;
  private windowSize = signal({ w: window.innerWidth, h: window.innerHeight });
  // `--slidev-slide-scale` is what the iframe layouts use to stay sharp (as in Slidev).
  protected canvasStyle = computed(() => {
    const scale = this.ui.slideScale() || fitScale(this.windowSize().w, this.windowSize().h);
    return { transform: `translate(-50%, -50%) scale(${scale})`, '--slidev-slide-scale': scale };
  });

  private stage?: Stage;
  private shown = 0; // the slide number on screen, to tell which way we moved
  private shortcuts = (() => {
    const actions = makeActions(this.nav, this.ui, this.dark, this.fullscreen);
    return inject(SHORTCUTS_SETUP)(actions, defaultShortcuts(actions));
  })();

  constructor() {
    // One slide component per slide number, so each slide gets a fresh ClicksContext.
    effect(() => {
      const no = this.nav.no(), host = this.host();
      this.stage ??= new Stage(host, this.canvas().nativeElement);
      untracked(() => (this.nav.notFound() ? this.clear() : this.show(no)));
    });
    // Keep ?clicks= in the URL up to date so a reload or shared link lands on the same click.
    effect(() => {
      const clicks = this.nav.ctx();
      if (!clicks || !clicks.mounted()) return;
      const url = new URL(location.href);
      url.searchParams.set('clicks', String(clicks.current()));
      history.replaceState(null, '', url);
    });
    hideIdleCursor(() => this.ui.hideIdleCursor());
  }

  private show(no: number) {
    const direction = Math.sign(no - this.shown);
    this.nav.direction.set(direction);
    const transition = this.shown ? pickTransition(this.nav.slides, this.shown, no, HEADMATTER['transition'] as string) : null;
    this.shown = no;
    const slide = this.stage!.show(no, transition);
    const wanted = new URLSearchParams(location.search).get('clicks');
    if (wanted != null) slide.clicks.setCurrent(+wanted || 0); // clamped once the slide is mounted
    this.nav.ctx.set(slide.clicks);
    const meta = this.nav.meta();
    const deckTitle = HEADMATTER['title'];
    document.title = [meta.title, deckTitle].filter((t, i, all) => t && all.indexOf(t) === i).join(' - ') || 'slide.ng';
  }

  private clear() {
    this.stage!.clear();
    this.shown = 0;
    this.nav.ctx.set(null);
  }

  measure() { this.windowSize.set({ w: window.innerWidth, h: window.innerHeight }); }

  key(e: KeyboardEvent) {
    if (isTyping(e.target)) return;
    const shortcut = findShortcut(e, this.shortcuts);
    if (!shortcut) return;
    e.preventDefault();
    shortcut.run();
  }

  // Clicking the dark area beside the slide goes forward (right half) or back (left half), like Slidev.
  stageClick(e: PointerEvent) {
    if (e.button === 0 && e.target === this.stageEl().nativeElement) {
      if (e.pageX / window.innerWidth > 0.5) this.nav.next();
      else this.nav.prev();
    }
  }

  // Shift + right click keeps the browser's own menu.
  contextMenu(e: MouseEvent) {
    if (e.shiftKey || e.defaultPrevented) return;
    e.preventDefault();
    this.ui.contextMenu.set({ x: e.pageX, y: e.pageY });
  }
}
