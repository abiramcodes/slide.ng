import { ComponentRef, Injector, ViewContainerRef } from '@angular/core';
import { SLIDES } from '../../slides/generated';
import { RENDER_CONTEXT, RenderContext, SLIDE_NO } from './slide-context';
import { SlideBase } from './slide-base';

// Creates the component of slide `no` (1-based) inside `host`, telling it where it is drawn.
export function mountSlide(host: ViewContainerRef, no: number, context: RenderContext): ComponentRef<SlideBase> {
  const injector = Injector.create({
    parent: host.injector,
    providers: [
      { provide: SLIDE_NO, useValue: no },
      { provide: RENDER_CONTEXT, useValue: context },
    ],
  });
  return host.createComponent(SLIDES[no - 1].component, { injector });
}
