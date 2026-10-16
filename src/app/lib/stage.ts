import { ComponentRef, ViewContainerRef } from '@angular/core';
import { mountSlide } from './mount-slide';
import { RenderContext } from './slide-context';
import { SlideBase } from './slide-base';
import { animationsFor, transitionDuration } from './transitions';

/**
 * Puts slides on the canvas, one at a time, and plays the transition between two of them.
 * While a transition runs, the old and the new slide are both in the page (stacked, see styles.css).
 */
export class Stage {
  private current?: ComponentRef<SlideBase>;
  private leaving: ComponentRef<SlideBase>[] = [];

  constructor(
    private host: ViewContainerRef,
    private canvas: HTMLElement,
    private context: RenderContext = 'slide',
  ) {}

  /** Removes the slide on screen (the 404 page takes its place). */
  clear() {
    this.finish();
    this.current?.destroy();
    this.current = undefined;
  }

  /** Shows slide `no`. `transition` is a resolved name (see transitions.ts) or null. */
  show(no: number, transition: string | null): SlideBase {
    this.finish(); // a transition still running is cut short
    const old = this.current;
    const make = () => {
      this.current = mountSlide(this.host, no, this.context);
      this.current.changeDetectorRef.detectChanges(); // draw it now, so an animation can start on real content
    };

    if (!old || !transition) {
      old?.destroy();
      make();
    } else if (transition === 'view-transition') {
      this.viewTransition(old, make);
    } else {
      make();
      this.animate(old, this.current!, transition);
    }
    return this.current!.instance;
  }

  // The browser takes a picture of the old page, we swap the slides, and it cross-fades to the new page.
  private viewTransition(old: ComponentRef<SlideBase>, make: () => void) {
    const swap = () => {
      old.destroy();
      make();
    };
    if ('startViewTransition' in document) (document as any).startViewTransition(swap);
    else swap(); // no support: switch without animation
  }

  private animate(old: ComponentRef<SlideBase>, entering: ComponentRef<SlideBase>, name: string) {
    const ms = transitionDuration();
    const pair = animationsFor(name, ms);
    if (!pair) {
      old.destroy();
      return;
    }
    this.canvas.dataset['transition'] = name; // visible to tests and to CSS
    this.leaving.push(old);
    const options = { duration: ms, easing: 'ease' } as const;
    // The entering slide holds its first frame during a delay; the leaving one holds its last frame until removed.
    const enter = entering.location.nativeElement.animate(pair.enter, {
      ...options,
      fill: 'backwards',
      ...pair.enterOptions,
    });
    const leave = old.location.nativeElement.animate(pair.leave, {
      ...options,
      fill: 'forwards',
      ...pair.leaveOptions,
    });
    // Both are done (fade-out delays the entering one): the old slide can go.
    Promise.all([enter.finished, leave.finished]).then(
      () => this.cleanUp(old),
      () => {},
    ); // cancelled: finish() cleans
  }

  private cleanUp(old: ComponentRef<SlideBase>) {
    if (!this.leaving.includes(old)) return;
    old.destroy();
    this.leaving = this.leaving.filter((r) => r !== old);
    if (!this.leaving.length) delete this.canvas.dataset['transition'];
  }

  // Cut a running transition short: remove the old slides now and stop the animations.
  private finish() {
    this.leaving.forEach((ref) => ref.destroy());
    this.leaving = [];
    delete this.canvas.dataset['transition'];
    this.current?.location.nativeElement.getAnimations().forEach((a: Animation) => a.cancel());
  }
}
