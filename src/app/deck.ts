import { Component, inject } from '@angular/core';
import { hideIdleCursor } from './lib/idle-cursor';
import { Nav } from './lib/nav';
import { SlideShow } from './lib/slide-show';
import { keyHandler } from './lib/key-handler';
import { Ui } from './lib/ui-state';
import { PresenterCursor } from './presenter/presenter-cursor';
import { startNavSync } from './sync/nav-sync';
import { ContextMenu } from './ui/context-menu';
import { Goto } from './ui/goto';
import { InfoDialog } from './ui/info-dialog';
import { NavBar } from './ui/nav-bar';
import { Overview } from './ui/overview';

// The route /:no, the audience's page. Shows one slide on a scaled canvas and hosts the controls around it.
@Component({
  selector: 'app-deck',
  imports: [SlideShow, PresenterCursor, NavBar, Overview, Goto, InfoDialog, ContextMenu],
  providers: [Nav, Ui],
  host: { '(window:keydown)': 'key($event)' },
  template: `
    <div
      class="stage"
      [class.slidev-nav-go-forward]="nav.direction() > 0"
      [class.slidev-nav-go-backward]="nav.direction() < 0"
      (contextmenu)="contextMenu($event)"
    >
      <app-slide-show context="slide"><app-presenter-cursor /></app-slide-show>
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
  protected key = keyHandler(this.nav, this.ui);

  constructor() {
    hideIdleCursor(() => this.ui.hideIdleCursor());
    startNavSync(this.nav);
  }

  // Shift + right click keeps the browser's own menu.
  contextMenu(e: MouseEvent) {
    if (e.shiftKey || e.defaultPrevented) return;
    e.preventDefault();
    this.ui.contextMenu.set({ x: e.pageX, y: e.pageY });
  }
}
