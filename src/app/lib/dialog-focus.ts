import { effect, untracked } from '@angular/core';

/**
 * Moves the focus into a dialog when it opens and gives it back to what had it before when it closes.
 * Call in a constructor. `target` is the dialog element (give it tabindex="-1").
 */
export function focusWhileOpen(open: () => boolean, target: () => HTMLElement | undefined) {
  let before: HTMLElement | null = null;
  effect(() => {
    if (open()) {
      untracked(() => (before = document.activeElement as HTMLElement | null));
      setTimeout(() => target()?.focus()); // after the dialog is drawn
    } else if (before) {
      const back = before;
      before = null;
      if (back !== document.body && back.isConnected) back.focus();
    }
  });
}
