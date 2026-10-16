import { inflateRawSync } from 'node:zlib';
import {
  DEFAULT_PLANTUML_SERVER,
  isMermaid,
  isPlantUml,
  renderMermaid,
  renderPlantUml,
} from './diagrams.mjs';
import { encodePlantUml } from './plantuml.mjs';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
// The reverse of encodePlantUml, written separately so the test checks something.
function decodePlantUml(text: string) {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i += 4) {
    const [a, b, c, d] = [...text.slice(i, i + 4)].map((ch) => ALPHABET.indexOf(ch));
    bytes.push((a << 2) | (b >> 4), ((b & 15) << 4) | (c >> 2), ((c & 3) << 6) | d);
  }
  return inflateRawSync(Buffer.from(bytes)).toString();
}

describe('plantuml encoding', () => {
  it('can be read back to the same text', () => {
    const text = '@startuml\nAlice -> Bob : Héllo!\n@enduml';
    expect(decodePlantUml(encodePlantUml(text)).startsWith(text)).toBe(true);
  });
  it('only uses the PlantUML alphabet', () => {
    expect(encodePlantUml('@startuml\nA -> B\n@enduml')).toMatch(/^[\w-]+$/);
  });
});

describe('diagram fences', () => {
  it('knows mermaid and plantuml fences by their info', () => {
    expect(isMermaid({ info: 'mermaid {scale:0.8}' })).toBe(true);
    expect(isMermaid({ info: 'ts' })).toBe(false);
    expect(isPlantUml({ info: 'plantuml' })).toBe(true);
  });
  it('writes <mermaid> with scale, theme, other options as JSON and the packed text', () => {
    const html = renderMermaid({
      info: "mermaid {theme:'neutral', scale:0.8, look:'handDrawn'}",
      code: 'graph TD\nA{{b}}',
    });
    expect(html).toMatch(
      /^<mermaid scale="0\.8" theme="neutral" config="&#123;&quot;look&quot;:&quot;handDrawn&quot;&#125;" packed="[A-Za-z0-9+/=]+"><\/mermaid>$/,
    );
    expect(html).not.toContain('A{{b}}'); // the diagram text is packed, so no braces reach the template
    expect(html).not.toMatch(/\{\{/);
  });
  it('writes <plant-uml> with the default server, or the headmatter one without a trailing slash', () => {
    const fence = { info: 'plantuml', code: '@startuml\nA -> B\n@enduml' };
    expect(renderPlantUml(fence)).toContain(`server="${DEFAULT_PLANTUML_SERVER}"`);
    expect(
      renderPlantUml(fence, { headmatter: { plantUmlServer: 'http://localhost:8080/plantuml/' } }),
    ).toContain('server="http://localhost:8080/plantuml"');
  });
});
