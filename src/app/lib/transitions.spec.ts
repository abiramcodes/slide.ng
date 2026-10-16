import { animationsFor, pickTransition, resolveTransition } from './transitions';

describe('resolveTransition', () => {
  it('turns a one-word name into forward and backward variants', () => {
    expect(resolveTransition('slide-left', false)).toBe('slide-left');
    expect(resolveTransition('slide-left', true)).toBe('slide-right');
    expect(resolveTransition('slide-up', true)).toBe('slide-down');
    expect(resolveTransition('slide-down', false)).toBe('slide-down');
  });
  it('leaves fade and view-transition the same in both directions', () => {
    expect(resolveTransition('fade', true)).toBe('fade');
    expect(resolveTransition('view-transition', true)).toBe('view-transition');
  });
  it('accepts "forward | backward" and the object form', () => {
    expect(resolveTransition('fade | slide-up', false)).toBe('fade');
    expect(resolveTransition('fade | slide-up', true)).toBe('slide-up');
    expect(resolveTransition({ name: 'slide-right' }, true)).toBe('slide-left');
  });
  it('gives null for nothing', () => {
    expect(resolveTransition(undefined, false)).toBeNull();
    expect(resolveTransition(null, false)).toBeNull();
    expect(resolveTransition({}, false)).toBeNull();
  });
});

describe('pickTransition', () => {
  const slides = [{ transition: null }, { transition: 'slide-left' }, { transition: 'fade' }, { transition: null }];
  it('uses the setting of the earlier slide, in both directions', () => {
    expect(pickTransition(slides, 2, 3, null)).toBe('slide-left');
    expect(pickTransition(slides, 3, 2, null)).toBe('slide-right');
    expect(pickTransition(slides, 3, 4, null)).toBe('fade');
  });
  it('falls back to the deck default, and to nothing', () => {
    expect(pickTransition(slides, 1, 2, 'fade')).toBe('fade');
    expect(pickTransition(slides, 1, 2, null)).toBeNull();
    expect(pickTransition(slides, 2, 2, 'fade')).toBeNull();
  });
});

describe('animationsFor', () => {
  it('moves slide-left in from the right and the old one out to the left', () => {
    const a = animationsFor('slide-left', 500)!;
    expect(a.enter[0]).toEqual({ translate: '100% 0' });
    expect(a.leave[1]).toEqual({ translate: '-100% 0' });
  });
  it('delays the entering slide for fade-out', () => {
    const a = animationsFor('fade-out', 500)!;
    expect(a.enterOptions).toMatchObject({ delay: 300, duration: 400 });
    expect(a.leaveOptions).toMatchObject({ duration: 300 });
  });
  it('knows no animation for view-transition or a made-up name', () => {
    expect(animationsFor('view-transition', 500)).toBeNull();
    expect(animationsFor('nope', 500)).toBeNull();
  });
});
