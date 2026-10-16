import { markOptions } from './mark-options';

describe('markOptions', () => {
  it('underlines by default', () => {
    expect(markOptions('1', '').type).toBe('underline');
  });
  it('reads type, colour, delay and opacity from modifiers', () => {
    const o = markOptions('2', 'red.circle.delay500.op50');
    expect(o).toMatchObject({
      at: '2',
      type: 'circle',
      color: '#ef4444',
      delay: 500,
      opacity: 0.5,
    });
  });
  it('knows the type aliases', () => {
    expect(markOptions('', 'strike').type).toBe('strike-through');
    expect(markOptions('', 'cross').type).toBe('crossed-off');
    expect(markOptions('', 'line-through').type).toBe('strike-through');
  });
  it('uses default delay and opacity when the number is missing', () => {
    expect(markOptions('', 'delay')).toMatchObject({ delay: 300 });
    expect(markOptions('', 'op')).toMatchObject({ opacity: 1 });
  });
  it('lets the object win over modifiers and takes `at` from it', () => {
    const o = markOptions({ at: 5, color: '#234', type: 'box' }, 'red.circle');
    expect(o).toMatchObject({ at: 5, color: '#234', type: 'box' });
  });
  it('keeps a range as the click value', () => {
    expect(markOptions([2, 4], 'blue').at).toEqual([2, 4]);
  });
  it('warns about unknown modifiers', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    markOptions('1', 'sparkly');
    expect(warn.mock.calls[0][1]).toBe('sparkly');
    warn.mockRestore();
  });
});
