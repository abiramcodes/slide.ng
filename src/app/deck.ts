import { Component, inject } from '@angular/core';
import { Dark } from './lib/dark';
import { Fullscreen } from './lib/fullscreen';
import { hideIdleCursor } from './lib/idle-cursor';
import { Nav } from './lib/nav';
import { makeActions } from './lib/actions';
import { SlideShow } from './lib/slide-show';
import { SHORTCUTS_SETUP, defaultShortcuts, findShortcut } from './lib/shortcuts';
import { Ui } from './lib/ui-state';
import { startNavSync } from './sync/nav-sync';
import { ContextMenu } from './ui/context-menu';
import { Goto } from './ui/goto';
import { InfoDialog } from './ui/info-dialog';
import { NavBar } from './ui/nav-bar';
import { Overview } from './ui/overview';

// Is the user typing somewhere? Then letters are text, not shortcuts.
// Keys typed into a text field or a Monaco editor (its input is a plain div) are not shortcuts.
const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest('.monaco-editor') !== null);

// The route /:no, the audience's page. Shows one slide on a scaled canvas and hosts the controls around it.
@Component({
  selector: 'app-deck',
  imports: [SlideShow, NavBar, Overview, Goto, InfoDialog, ContextMenu],
  providers: [Nav, Ui],
  host: { '(window:keydown)': 'key($event)' },
  template: `
    <div
      class="stage"
      [class.slidev-nav-go-forward]="nav.direction() > 0"
      [class.slidev-nav-go-backward]="nav.direction() < 0"
      (contextmenu)="contextMenu($event)"
    >
      <app-slide-show context="slide" />
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
  private shortcuts = (() => {
    const actions = makeActions(this.nav, this.ui, inject(Dark), inject(Fullscreen));
    return inject(SHORTCUTS_SETUP)(actions, defaultShortcuts(actions));
  })();

  constructor() {
    hideIdleCursor(() => this.ui.hideIdleCursor());
    startNavSync(this.nav);
  }

  key(e: KeyboardEvent) {
    if (isTyping(e.target)) return;
    const shortcut = findShortcut(e, this.shortcuts);
    if (!shortcut) return;
    e.preventDefault();
    shortcut.run();
  }

  // Shift + right click keeps the browser's own menu.
  contextMenu(e: MouseEvent) {
    if (e.shiftKey || e.defaultPrevented) return;
    e.preventDefault();
    this.ui.contextMenu.set({ x: e.pageX, y: e.pageY });
  }
}
