import { InjectionToken } from '@angular/core';

// Where a slide is drawn. `<slide-ng-render-when context="...">` looks at this.
export type RenderContext = 'slide' | 'presenter' | 'previewNext' | 'print' | 'overview';

// Each slide component is created with these two, so built-in components know which slide they are in.
export const SLIDE_NO = new InjectionToken<number>('SLIDE_NO', { factory: () => 1 });
export const RENDER_CONTEXT = new InjectionToken<RenderContext>('RENDER_CONTEXT', {
  factory: () => 'slide',
});
