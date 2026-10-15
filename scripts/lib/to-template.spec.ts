import { toTemplate } from './to-template.mjs';

describe('toTemplate: Angular syntax is protected', () => {
  it('keeps {{ interpolation }} as written', () => {
    expect(toTemplate('Count is {{ count() + 1 }}.')).toContain('<p>Count is {{ count() + 1 }}.</p>');
  });
  it('keeps @if blocks as written', () => {
    const html = toTemplate('@if (a > 1) {\nbig\n} @else {\nsmall\n}');
    expect(html).toContain('@if (a > 1) {');
    expect(html).toContain('} @else {');
    expect(html).toContain('big');
  });
  it('keeps @for and @let lines', () => {
    const html = toTemplate('@let n = 3;\n\n@for (i of items; track i) {\n{{ i }}\n}');
    expect(html).toContain('@let n = 3;');
    expect(html).toContain('@for (i of items; track i) {');
  });
  it('keeps tags with bindings, events and template references untouched', () => {
    const html = toTemplate('<app-counter #c [start]="5" (changed)="x = $event" />');
    expect(html).toContain('<app-counter #c [start]="5" (changed)="x = $event" />');
  });
  it('keeps a binding tag that sits inside a paragraph', () => {
    expect(toTemplate('Hello <b [class.x]="a">there</b>')).toContain('<b [class.x]="a">');
  });
  it('still renders markdown around it', () => {
    expect(toTemplate('**bold** {{ x }}')).toContain('<strong>bold</strong> {{ x }}');
  });
});

describe('toTemplate: plain text is made safe', () => {
  it('escapes a lone @ and braces in normal text', () => {
    const html = toTemplate('mail me@example.com {not a block}');
    expect(html).toContain('me&#64;example.com');
    expect(html).toContain('&#123;not a block&#125;');
  });
  it('treats plain HTML attributes like v-click as normal markup', () => {
    expect(toTemplate('<div v-click="2">hi</div>')).toContain('<div v-click="2">hi</div>');
  });
});

describe('toTemplate: code is literal', () => {
  const fence = '```ts\nconst o = { a: 1 }; // @Component {{ x }} <b>\n```';
  it('escapes braces, @, {{ and < in a code fence', () => {
    const html = toTemplate(fence);
    expect(html).toContain('<pre ngNonBindable><code class="language-ts">');
    expect(html).toContain('const o = &#123; a: 1 &#125;; // &#64;Component &#123;&#123; x &#125;&#125; &lt;b&gt;');
    expect(html).not.toContain('{');
  });
  it('does not touch Angular syntax inside a fence', () => {
    const html = toTemplate('```html\n@if (x) {\n<app-counter [start]="1" />\n}\n```');
    expect(html).not.toContain('@if');
    expect(html).toContain('&lt;app-counter [start]="1" /&gt;');
  });
  it('keeps a blank line and --- inside a fence', () => {
    expect(toTemplate('```md\na\n\n---\nb\n```')).toContain('a\n\n---\nb');
  });
  it('makes inline code literal too', () => {
    const html = toTemplate('Use `{{ x }}` and `@if` here');
    expect(html).toContain('<code ngNonBindable>&#123;&#123; x &#125;&#125;</code>');
    expect(html).toContain('<code ngNonBindable>&#64;if</code>');
  });
});
