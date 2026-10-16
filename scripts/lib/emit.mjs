// Writes the TypeScript source of one generated slide component.
import { COMPONENTS, LAYOUTS } from './registry.mjs';
import { layoutName } from './layouts.mjs';
import { extractStyles, scopeCss } from './scoped-style.mjs';
import { splitSlots } from './slots.mjs';
import { toTemplate } from './to-template.mjs';

const pad = (no) => String(no).padStart(3, '0');
export const slideName = (no) => `slide-${pad(no)}`;
export const slideClass = (no) => `Slide${pad(no)}`;
export { layoutName };

// Escape a value for use inside a double-quoted HTML attribute.
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/[{}@]/g, (c) => `&#${c.charCodeAt(0)};`);

// The layout's opening tag: frontmatter keys the layout knows become attributes (= inputs).
function openTag(def, frontmatter) {
  const attrs = def.props.filter((p) => frontmatter[p] != null).map((p) => ` ${p}="${attr(frontmatter[p])}"`);
  if (frontmatter.class) attrs.push(` ${def.classProp ? 'contentClass' : 'class'}="${attr(frontmatter.class)}"`);
  return `<${def.tag}${attrs.join('')}>`;
}

// The slide body. `::name::` lines cut it into slots; a named slot is projected into the layout.
function body(markdown, def, no) {
  return splitSlots(markdown)
    .map(([name, text]) => {
      if (name === 'default') return toTemplate(text);
      if (!def.slots.includes(name)) {
        console.warn(`[slides] slide ${no}: layout "${def.tag.slice(3)}" has no slot "${name}", showing it as normal content`);
        return toTemplate(text);
      }
      return `<ng-container ngProjectAs="[${name}]">${toTemplate(text)}</ng-container>`;
    })
    .join('');
}

export function slideSource(slide, no) {
  const def = LAYOUTS[slide.layout ?? layoutName(slide.frontmatter, no - 1)];
  const { markdown, css } = extractStyles(slide.content);
  const html = `${openTag(def, slide.frontmatter)}${body(markdown, def, no)}</${def.tag}>`;

  // Look for components outside code samples only (code is just text).
  const markup = html.replace(/<pre[\s\S]*?<\/pre>/g, '').replace(/<code[^>]*>[\s\S]*?<\/code>/g, '');
  const used = COMPONENTS.filter((c) => c.test.test(markup));
  const imports = [def, ...used];
  const importLines = [...new Set(imports.map((c) => `import { ${c.className} } from '../../app/${c.file}';`))];

  const { clicksStart, clicks } = slide.frontmatter;
  const providers = ['ClicksContext'];
  if (clicksStart) providers.push(`{ provide: CLICKS_START, useValue: ${+clicksStart} }`);
  if (clicks) providers.push(`{ provide: CLICKS_TOTAL, useValue: ${+clicks} }`);
  const styles = scopeCss(css, slideName(no));

  return `// GENERATED from slides.md (slide ${no}) - do not edit
import { Component${styles ? ', ViewEncapsulation' : ''} } from '@angular/core';
import { CLICKS_START, CLICKS_TOTAL, ClicksContext } from '../../app/lib/clicks';
import { SlideBase } from '../../app/lib/slide-base';
${importLines.join('\n')}

@Component({
  selector: '${slideName(no)}',
  imports: [${imports.map((c) => c.className).join(', ')}],
  providers: [${providers.join(', ')}],
  template: ${JSON.stringify(html)},${styles ? `\n  styles: [${JSON.stringify(styles)}],\n  encapsulation: ViewEncapsulation.None,` : ''}
})
export default class ${slideClass(no)} extends SlideBase {}
`;
}
