import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { focusWhileOpen } from './dialog-focus';

describe('focusWhileOpen', () => {
  it('moves the focus into the dialog and back again', async () => {
    const opener = document.createElement('button');
    const dialog = document.createElement('div');
    dialog.tabIndex = -1;
    document.body.append(opener, dialog);
    opener.focus();

    const open = signal(false);
    TestBed.runInInjectionContext(() => focusWhileOpen(open, () => dialog));
    TestBed.tick();

    open.set(true);
    TestBed.tick();
    await new Promise((r) => setTimeout(r));
    expect(document.activeElement).toBe(dialog);

    open.set(false);
    TestBed.tick();
    expect(document.activeElement).toBe(opener);
    opener.remove();
    dialog.remove();
  });
});
