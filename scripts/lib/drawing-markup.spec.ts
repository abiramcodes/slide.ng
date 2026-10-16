import { cleanDrawing } from './drawing-markup.mjs';

describe('cleanDrawing', () => {
  it('accepts what drauu writes, and builds it again', () => {
    const drawn =
      '<defs><marker id="arrow-1" markerHeight="3" markerWidth="4" orient="auto" refX="3" refY="1.5" viewBox="0 0 4 3"><polygon points="0,0 4,1.5 0,3" fill="red"/></marker></defs>' +
      '<path d="M0 0L10 10" stroke="red" stroke-width="3" stroke-linecap="round" fill="transparent" marker-end="url(#arrow-1)"/>' +
      '<g transform="translate(1 2)"><ellipse cx="1" cy="2" rx="3" ry="4" fill="none" stroke="#000"></ellipse></g>';
    expect(cleanDrawing(drawn)).toBe(drawn.replace('></ellipse>', '></ellipse>'));
  });
  it('accepts white space between elements and single quotes, and writes double quotes', () => {
    expect(cleanDrawing('<path d=\'M0 0\'/>\n <rect x="1" y="2" width="3" height="4"/>')).toBe(
      '<path d="M0 0"/><rect x="1" y="2" width="3" height="4"/>',
    );
    expect(cleanDrawing('')).toBe('');
  });

  it('refuses the bypasses of the old pattern: no space before an event handler', () => {
    for (const bad of [
      '<path/onclick=alert(1) d="M0 0"/>',
      '<path d="M0 0"onmouseover=alert(1)/>',
      '<path d="M0 0" onclick="alert(1)"/>',
      '<path d="M0 0" ONCLICK="x"/>',
      '<path d="M0 0"\nonload=1 />',
      '<path d=M0/>',
    ])
      expect(cleanDrawing(bad), bad).toBeNull();
  });
  it('refuses elements that are not shapes', () => {
    for (const bad of [
      '<script>alert(1)</script>',
      '<svg onload="x()"></svg>',
      '<a href="x"><path d="M0 0"/></a>',
      '<image href="x"/>',
      '<foreignObject><body onload=1></body></foreignObject>',
      '<use href="#a"/>',
      '<style>*{}</style>',
      '<text>hi</text>',
      '<animate attributeName="d"/>',
      '<set attributeName="onclick"/>',
    ])
      expect(cleanDrawing(bad), bad).toBeNull();
  });
  it('refuses attributes that are not in the list: events, links, style, namespaces', () => {
    for (const bad of [
      '<path style="fill:red" d="M0 0"/>',
      '<path href="x"/>',
      '<path xlink:href="x"/>',
      '<path xmlns="x"/>',
      '<path class="a"/>',
      '<path d="M0 0" d="M1 1"/>',
      '<g onfocus="x"></g>',
    ])
      expect(cleanDrawing(bad), bad).toBeNull();
  });
  it('refuses values that load something, run something or break the markup', () => {
    for (const bad of [
      '<path fill="url(http://evil.test/x)"/>',
      '<path fill="url(//evil.test/x)"/>',
      '<path fill="url(#a) url(//x)"/>',
      '<path fill="javascript:alert(1)"/>',
      '<path fill="data:image/svg+xml,x"/>',
      '<path d="M0 0&#x22; onclick=1"/>',
      '<path d="a<b"/>',
      '<path d="a>b"/>',
    ])
      expect(cleanDrawing(bad), bad).toBeNull();
  });
  it('refuses comments, processing instructions, CDATA, doctypes and loose text', () => {
    for (const bad of [
      '<!-- x -->',
      '<?xml version="1.0"?>',
      '<![CDATA[x]]>',
      '<!DOCTYPE svg>',
      'text <path d="M0 0"/>',
      '<g>text</g>',
      '&lt;path/&gt;',
    ])
      expect(cleanDrawing(bad), bad).toBeNull();
  });
  it('refuses broken structure: unclosed, mismatched, stray closing tags', () => {
    for (const bad of [
      '<g>',
      '<g></path>',
      '</g>',
      '<g><path d="M0 0"/>',
      '<path d="M0 0"',
      '<',
      '<path d="x/>',
    ])
      expect(cleanDrawing(bad), bad).toBeNull();
  });
  it('keeps depth and size limits', () => {
    expect(cleanDrawing('<g>'.repeat(30) + '</g>'.repeat(30))).toBeNull();
    expect(cleanDrawing('<path d="M0 0"/>'.repeat(10), 50)).toBeNull();
    expect(cleanDrawing(5)).toBeNull();
  });
  it('quotes values again so a single quote cannot end the attribute', () => {
    expect(cleanDrawing(`<path d='a"b'/>`)).toBe('<path d="a&quot;b"/>');
  });
});
