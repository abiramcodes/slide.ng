import { inject } from '@angular/core';
import { Drawings } from '../drawing/drawings';
import { DragState } from '../drag/drag-state';
import { makeActions } from './actions';
import { Dark } from './dark';
import { Fullscreen } from './fullscreen';
import { Nav } from './nav';
import { SHORTCUTS_SETUP, defaultShortcuts, findShortcut } from './shortcuts';
import { Ui } from './ui-state';

// Is the user typing somewhere? Then letters are text, not shortcuts.
// Keys typed into a text field or a Monaco editor (its input is a plain div) are not shortcuts.
const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable ||
    /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) ||
    t.closest('.monaco-editor') !== null);

/** The keydown handler of a page that has a Nav and a Ui: the deck and the presenter share it. Call in a constructor. */
export function keyHandler(nav: Nav, ui: Ui): (e: KeyboardEvent) => void {
  const actions = makeActions(
    nav,
    ui,
    inject(Dark),
    inject(Fullscreen),
    inject(Drawings),
    inject(DragState),
  );
  const shortcuts = inject(SHORTCUTS_SETUP)(actions, defaultShortcuts(actions));
  return (e) => {
    if (isTyping(e.target)) return;
    const shortcut = findShortcut(e, shortcuts);
    if (!shortcut) return;
    e.preventDefault();
    shortcut.run();
  };
}
