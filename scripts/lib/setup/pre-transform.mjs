// Runs the `pre` transformers of setup/transformers.ts on each slide's markdown, as Slidev does.
// A transformer gets `{ s, slide, options }`: `s` is a MagicString of the slide's markdown (edit it with s.replace, s.append, ...).
import MagicString from 'magic-string';
import { slideInfo } from '../emit.mjs';

/** Changes `slide.content` of every slide. A transformer may be async. */
export async function applyPreTransformers(slides, transformers, headmatter) {
  if (!transformers.length) return;
  for (const [i, slide] of slides.entries()) {
    const s = new MagicString(slide.content);
    for (const transform of transformers) await transform({ s, slide: slideInfo(slide, i + 1), options: { data: { headmatter } } });
    slide.content = s.toString();
  }
}
