// Writes the TypeScript source of the generated files.
import { COMPONENTS, LAYOUTS } from './registry.mjs';
import { toTemplate } from './to-template.mjs';

const pad = (no) => String(no).padStart(3, '0');
export const slideName = (no) => `slide-${pad(no)}`;
export const slideClass = (no) => `Slide${pad(no)}`;

// Escape a value for use inside a double-quoted HTML attribute.
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/[{}@]/g, (c) => `&#${c.charCodeAt(0)};`);

// Slidev's rule: first slide is a cover, the others use `default`.
export function layoutName(frontmatter, index) {
  const wanted = frontmatter.layout ?? (index === 0 ? 'cover' : 'default');
  if (LAYOUTS[wanted]) return wanted;
  console.warn(`[slides] unknown layout "${wanted}", using "default"`);
  return 'default';
}

// The slide body. For `two-cols`, `::right::` splits it into two parts.
function body(content, layout) {
  if (layout !== 'two-cols') return toTemplate(content);
  const [left, right = ''] = content.split(/^::right::[ \t]*$/m);
  return `${toTemplate(left)}<div right>${toTemplate(right)}</div>`;
}

export function slideSource(slide, no) {
  const layout = layoutName(slide.frontmatter, no - 1);
  const { className, tag, file } = LAYOUTS[layout];
  const cls = slide.frontmatter.class ? ` class="${attr(slide.frontmatter.class)}"` : '';
  const html = `<${tag}${cls}>${body(slide.content, layout)}</${tag}>`;

  // Look for components outside code samples only (code is just text).
  const markup = html.replace(/<pre[\s\S]*?<\/pre>/g, '').replace(/<code[^>]*>[\s\S]*?<\/code>/g, '');
  const used = COMPONENTS.filter((c) => c.test.test(markup));
  const imports = [{ className, file }, ...used];
  const importLines = [...new Set(imports.map((c) => `import { ${c.className} } from '../../app/${c.file}';`))];
  const start = slide.frontmatter.clicksStart;
  const providers = ['ClicksContext', ...(start ? [`{ provide: CLICKS_START, useValue: ${+start} }`] : [])];

  return `// GENERATED from slides.md (slide ${no}) - do not edit
import { Component } from '@angular/core';
import { CLICKS_START, ClicksContext } from '../../app/lib/clicks';
import { SlideBase } from '../../app/lib/slide-base';
${importLines.join('\n')}

@Component({
  selector: '${slideName(no)}',
  imports: [${imports.map((c) => c.className).join(', ')}],
  providers: [${providers.join(', ')}],
  template: ${JSON.stringify(html)},
})
export default class ${slideClass(no)} extends SlideBase {}
`;
}

// index.ts: the list of slides with their metadata.
export function indexSource(deck) {
  const imports = deck.slides.map((_, i) => `import ${slideClass(i + 1)} from './${slideName(i + 1)}';`);
  const entries = deck.slides.map((s, i) => {
    const meta = { title: s.title ?? null, layout: layoutName(s.frontmatter, i), note: s.note ?? null, frontmatter: s.frontmatter };
    return `  { ${JSON.stringify(meta).slice(1, -1)}, component: ${slideClass(i + 1)} },`;
  });
  return `// GENERATED from slides.md - do not edit
import type { SlideMeta } from '../../app/lib/slide-meta';
${imports.join('\n')}

export const HEADMATTER: Record<string, unknown> = ${JSON.stringify(deck.headmatter)};

export const SLIDES: SlideMeta[] = [
${entries.join('\n')}
];
`;
}
