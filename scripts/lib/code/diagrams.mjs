// ```mermaid and ```plantuml fences. Mermaid is drawn in the browser (lazy, see src/app/code/mermaid.ts);
// PlantUML is an <img> from a PlantUML server, so only its URL is made here.
import { parseOptions } from './meta.mjs';
import { encodePlantUml } from './plantuml.mjs';
import { attrs } from '../protect.mjs';
import { pack } from '../pack.mjs';

const MERMAID = /^mermaid\s*(\{[^\n]*\})?/;
const PLANTUML = /^plantuml\s*(\{[^\n]*\})?/;
export const DEFAULT_PLANTUML_SERVER = 'https://www.plantuml.com/plantuml';

export const isMermaid = (fence) => MERMAID.test(fence.info);
export const isPlantUml = (fence) => PLANTUML.test(fence.info);

export function renderMermaid(fence) {
  const { scale, theme, ...config } = parseOptions(MERMAID.exec(fence.info)[1]);
  const extra = Object.keys(config).length ? JSON.stringify(config) : undefined;
  return `<mermaid${attrs({ scale, theme, config: extra })} packed="${pack(fence.code.trim())}"></mermaid>`;
}

export function renderPlantUml(fence, ctx = {}) {
  const { scale, alt } = parseOptions(PLANTUML.exec(fence.info)[1]);
  const server = (ctx.headmatter?.plantUmlServer ?? DEFAULT_PLANTUML_SERVER).replace(/\/$/, '');
  return `<plant-uml${attrs({ scale, alt, server })} code="${encodePlantUml(fence.code.trim())}"></plant-uml>`;
}
