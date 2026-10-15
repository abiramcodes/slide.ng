import { Type } from '@angular/core';
import { ClicksContext } from './clicks';

/** What the generator writes for each slide into src/slides/generated/index.ts. */
export interface SlideMeta {
  title: string | null;
  layout: string;
  note: string | null;
  frontmatter: Record<string, unknown>; // every frontmatter key; unknown keys are kept and ignored
  component: Type<{ clicks: ClicksContext }>;
}
