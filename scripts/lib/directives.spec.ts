import { rewriteDirectives } from './directives.mjs';

describe('rewriteDirectives: v-mark', () => {
  it('moves the modifiers into an attribute', () => {
    expect(rewriteDirectives('<span v-mark.red.circle="2">x</span>')).toBe('<span mark-mods="red.circle" v-mark="2">x</span>');
  });
  it('keeps a bare v-mark and other attributes', () => {
    expect(rewriteDirectives('<span class="a" v-mark>x</span>')).toBe('<span class="a" v-mark>x</span>');
  });
  it('turns an object or a range into a binding', () => {
    expect(rewriteDirectives(`<b v-mark="{ at: 5, color: '#234' }">`)).toBe(`<b [v-mark]="{ at: 5, color: '#234' }">`);
    expect(rewriteDirectives('<b v-mark.blue="[2, 4]">')).toBe('<b mark-mods="blue" [v-mark]="[2, 4]">');
  });
  it('unquotes a Vue string like "\'+1\'"', () => {
    expect(rewriteDirectives(`<b v-mark="'+1'">`)).toBe('<b v-mark="+1">');
  });
  it('leaves other tags alone', () => {
    const html = '<div class="x" v-click>a</div> and <a href="b">c</a>';
    expect(rewriteDirectives(html)).toBe(html);
  });
});

describe('rewriteDirectives: v-motion', () => {
  it('collects the variants into one binding', () => {
    const html = '<div v-motion :initial="{ x: -80 }" :enter="{ x: 0 }" :click-2-4="{ y: 3 }" :leave="{ x: 80 }" class="a">hi</div>';
    expect(rewriteDirectives(html)).toBe(
      `<div class="a" [v-motion]="{ 'initial': ({ x: -80 }), 'enter': ({ x: 0 }), 'click-2-4': ({ y: 3 }), 'leave': ({ x: 80 }) }">hi</div>`,
    );
  });
  it('keeps v-click on the same element', () => {
    expect(rewriteDirectives('<div v-click="[2,4]" v-motion :enter="{ x: 0 }">')).toContain('v-click="[2,4]"');
  });
  it('warns about variants it cannot do and drops them', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(rewriteDirectives('<div v-motion :hovered="{ x: 1 }">')).not.toContain('hovered');
    expect(warn.mock.calls[0][0]).toContain(':hovered');
    warn.mockRestore();
  });
});
