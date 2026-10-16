// Writes generated/index.ts: the list of slides with their metadata, and the deck's headmatter.
import { marked } from 'marked';
import { layoutName } from './layouts.mjs';
import { slideClass, slideName } from './emit.mjs';
import { noteToHtml } from './note-html.mjs';

// What the app needs to know about one slide, besides its component.
function metaOf(slide, index) {
  const f = slide.frontmatter;
  return {
    title: slide.title ?? null,
    level: slide.level ?? null,
    layout: slide.layout ?? layoutName(f, index),
    note: slide.note ?? null,
    noteHtml: noteToHtml(slide.note),
    routeAlias: f.routeAlias != null ? String(f.routeAlias) : null,
    hideInToc: Boolean(f.hideInToc),
    transition: f.transition ?? null,
    frontmatter: f,
  };
}

export function indexSource(deck) {
  const imports = deck.slides.map((_, i) => `import ${slideClass(i + 1)} from './${slideName(i + 1)}';`);
  const entries = deck.slides.map(
    (s, i) => `  { ${JSON.stringify(metaOf(s, i)).slice(1, -1)}, component: ${slideClass(i + 1)} },`,
  );
  // `info:` in the headmatter is markdown for the info dialog; we turn it into HTML here.
  const info = typeof deck.headmatter.info === 'string' ? marked.parse(deck.headmatter.info, { async: false }) : null;
  return `// GENERATED from slides.md - do not edit
import type { SlideMeta } from '../../app/lib/slide-meta';
${imports.join('\n')}

export const HEADMATTER: Record<string, unknown> = ${JSON.stringify(deck.headmatter)};
export const INFO_HTML: string | null = ${JSON.stringify(info)};
/** Drawings saved in .slide-ng/drawings (only with \`drawings: { persist: true }\`): slide number -> SVG markup. */
export const DRAWINGS: Record<number, string> = ${JSON.stringify(deck.drawings ?? {})};

export const SLIDES: SlideMeta[] = [
${entries.join('\n')}
];
`;
}
