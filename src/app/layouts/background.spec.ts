import { background, resolveAssetUrl } from './background';

describe('background', () => {
  it('gives nothing when there is no value', () => {
    expect(background(undefined)).toEqual({});
    expect(background('')).toEqual({});
  });
  it('uses a colour as it is', () => {
    expect(background('#ff0000')).toEqual({ background: '#ff0000' });
    expect(background('rgb(0, 0, 0)')).toEqual({ background: 'rgb(0, 0, 0)' });
  });
  it('makes anything else an image, with white text', () => {
    const s = background('/a.png');
    expect(s['background-image']).toBe('url("/a.png")');
    expect(s['color']).toBe('white');
    expect(s['background-size']).toBe('cover');
  });
  it('puts the deck base in front of an address that starts with a slash, like Slidev', () => {
    const base = document.createElement('base');
    base.href = '/talk/';
    document.head.appendChild(base);
    try {
      expect(resolveAssetUrl('/a.png')).toBe('/talk/a.png');
      expect(resolveAssetUrl('a.png')).toBe('a.png');
      expect(resolveAssetUrl('https://x.test/a.png')).toBe('https://x.test/a.png');
      expect(background('/a.png')['background-image']).toBe('url("/talk/a.png")');
    } finally { base.remove(); }
  });
  it('can dim the image and change its size', () => {
    const s = background('/a.png', true, 'contain');
    expect(s['background-image']).toContain('linear-gradient');
    expect(s['background-size']).toBe('contain');
  });
});
