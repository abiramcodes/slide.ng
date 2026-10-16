import { DestroyRef, ElementRef, Signal, inject, signal } from '@angular/core';

/** The size of this component's host element as a signal; it follows the element when the window or a pane is resized. */
export function hostSize(): Signal<{ w: number; h: number }> {
  const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const size = signal({ w: el.clientWidth || window.innerWidth, h: el.clientHeight || window.innerHeight });
  const observer = new ResizeObserver(() => size.set({ w: el.clientWidth, h: el.clientHeight }));
  observer.observe(el);
  inject(DestroyRef).onDestroy(() => observer.disconnect());
  return size;
}
