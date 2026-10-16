import { cleanSvg, drawingImageUrl } from './clean-svg';

describe('cleanSvg', () => {
  it('keeps what drauu writes', () => {
    const input = '<path d="M0 0L10 10" stroke="#f00" fill="none" marker-end="url(#arrow)"></path><line x1="0" y1="0" x2="5" y2="5" stroke="#000"></line>';
    const out = cleanSvg(input);
    expect(out).toContain('<path d="M0 0L10 10"');
    expect(out).toContain('marker-end="url(#arrow)"');
    expect(out).toContain('<line x1="0"');
  });

  it('drops scripts, foreign objects and images', () => {
    const out = cleanSvg('<script>alert(1)</script><foreignObject><div>x</div></foreignObject><image href="http://evil/x.png"/><path d="M0 0"/>');
    expect(out).not.toMatch(/script|foreignObject|image|evil/i);
    expect(out).toContain('<path');
  });

  it('drops event handlers, links and external urls from attributes', () => {
    const out = cleanSvg('<path d="M0 0" onclick="alert(1)" onload="x()" href="javascript:alert(1)" fill="url(http://evil/a)" stroke="red"/>');
    expect(out).not.toMatch(/onclick|onload|href|javascript|evil/);
    expect(out).toContain('stroke="red"');
  });

  it('drops nested bad children', () => {
    expect(cleanSvg('<g><script>1</script><path d="M0 0"/></g>')).toBe('<g><path d="M0 0"/></g>');
  });

  it('gives an empty text for broken markup', () => {
    expect(cleanSvg('<path d="M0 0"')).toBe('');
    expect(cleanSvg('')).toBe('');
  });
});

describe('drawingImageUrl', () => {
  it('makes a data address of an image', () => {
    expect(drawingImageUrl('<path/>')).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
  });
});
