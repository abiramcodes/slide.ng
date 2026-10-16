// Tests for the click engine. The cases follow Slidev's useClicks.ts behaviour.
// Vitest runs every spec file in its own isolated environment, and TestBed is reset after each test.
import { TestBed } from '@angular/core/testing';
import { CLICKS_START, ClicksContext, normalizeSingle } from './clicks';

// Makes a ClicksContext; `mount` pretends the slide has been rendered (what afterNextRender does).
function make(clicksStart = 0, mount = true) {
  TestBed.configureTestingModule({
    providers: [ClicksContext, { provide: CLICKS_START, useValue: clicksStart }],
  });
  const ctx = TestBed.inject(ClicksContext);
  if (mount) TestBed.tick();
  return ctx;
}

describe('normalizeSingle', () => {
  it('false means never', () => {
    expect(normalizeSingle(false)).toBeNull();
    expect(normalizeSingle('false')).toBeNull();
  });
  it('no value means +1', () => {
    for (const v of [undefined, null, true, 'true', '']) expect(normalizeSingle(v)).toBe('+1');
  });
  it('keeps relative strings and turns numbers into absolute numbers', () => {
    expect(normalizeSingle('+2')).toBe('+2');
    expect(normalizeSingle('-1')).toBe('-1');
    expect(normalizeSingle('3')).toBe(3);
    expect(normalizeSingle(4)).toBe(4);
  });
  it('rejects text that is not a number', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(normalizeSingle('abc')).toBeNull();
    expect(error).toHaveBeenCalled();
  });
  it('turns 0 and negative numbers into 1 with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(normalizeSingle(0)).toBe(1);
    expect(normalizeSingle(-5)).toBe(1);
    expect(warn).toHaveBeenCalledTimes(2);
  });
});

describe('calculateSince', () => {
  it('absolute: starts at that click and does not move the offset', () => {
    const info = make().calculateSince(3)!;
    expect([info.start, info.end, info.max, info.delta]).toEqual([3, Infinity, 3, 0]);
    expect(info.isActive(2)).toBe(false);
    expect(info.isActive(3) && info.isActive(9)).toBe(true);
    expect(info.isCurrent(3)).toBe(true);
    expect(info.isCurrent(4)).toBe(false);
  });
  it('relative: each +1 comes after the previous one', () => {
    const ctx = make(0, false);
    const a = ctx.calculateSince('+1')!;
    ctx.register('a', a);
    const b = ctx.calculateSince('+1')!;
    ctx.register('b', b);
    expect([a.start, b.start, b.max]).toEqual([1, 2, 2]);
  });
  it('relative +0 shares the click of the previous element (slide-ng-after)', () => {
    const ctx = make(0, false);
    ctx.register('a', ctx.calculateSince('+1'));
    expect(ctx.calculateSince('+0')!.start).toBe(1);
  });
  it('absolute elements do not move the relative position', () => {
    const ctx = make(0, false);
    ctx.register('a', ctx.calculateSince(5));
    expect(ctx.calculateSince('+1')!.start).toBe(1);
  });
  it('size spans several clicks', () => {
    const info = make().calculateSince('+1', 3)!;
    expect([info.start, info.max, info.delta]).toEqual([1, 3, 3]);
  });
  it('false gives null', () => {
    expect(make().calculateSince(false)).toBeNull();
  });
});

describe('calculateRange', () => {
  it('absolute range is active from start up to, not including, end', () => {
    const info = make().calculateRange([2, 4])!;
    expect([info.start, info.end, info.max, info.delta]).toEqual([2, 4, 4, 0]);
    expect([1, 2, 3, 4].map((c) => info.isActive(c))).toEqual([false, true, true, false]);
  });
  it('relative range: start after the offset, end relative to start', () => {
    const ctx = make(0, false);
    ctx.register('a', ctx.calculateSince('+1'));
    const info = ctx.calculateRange(['+1', '+2'])!;
    expect([info.start, info.end, info.delta]).toEqual([2, 4, 3]);
  });
  it('not an array gives null', () => {
    expect(make().calculateRange(3)).toBeNull();
  });
  it('calculate picks since or range', () => {
    const ctx = make();
    expect(ctx.calculate(2)!.end).toBe(Infinity);
    expect(ctx.calculate([2, 3])!.end).toBe(3);
  });
});

describe('total and current', () => {
  it('total is 0 until mounted, then the largest max', () => {
    const ctx = make(0, false);
    ctx.register('a', ctx.calculateSince(2));
    ctx.register('b', ctx.calculateSince(5));
    expect(ctx.total()).toBe(0);
    TestBed.tick();
    expect(ctx.total()).toBe(5);
  });
  it('an element registered after mount raises the total', () => {
    const ctx = make();
    ctx.register('a', ctx.calculateSince(2));
    expect(ctx.total()).toBe(2);
  });
  it('unregister lowers the total again', () => {
    const ctx = make();
    ctx.register('a', ctx.calculateSince(2));
    ctx.unregister('a');
    expect(ctx.total()).toBe(0);
  });
  it('registering null does nothing', () => {
    const ctx = make();
    ctx.register('a', null);
    expect(ctx.total()).toBe(0);
  });
  it('current is clamped between start and total', () => {
    const ctx = make();
    ctx.register('a', ctx.calculateSince(3));
    ctx.setCurrent(99);
    expect(ctx.current()).toBe(3);
    ctx.setCurrent(-4);
    expect(ctx.current()).toBe(0);
  });
  it('a value set before mount is kept and clamped after mount', () => {
    const ctx = make(0, false);
    ctx.register('a', ctx.calculateSince(3));
    ctx.setCurrent(99);
    expect(ctx.current()).toBe(0); // total is 0 before mount
    TestBed.tick();
    expect(ctx.current()).toBe(3);
  });
  it('next and prev stop at the ends', () => {
    const ctx = make();
    ctx.register('a', ctx.calculateSince(2));
    ctx.prev();
    expect(ctx.current()).toBe(0);
    ctx.next();
    ctx.next();
    ctx.next();
    expect(ctx.current()).toBe(2);
  });
  it('clicksStart is the first click and the lower limit', () => {
    const ctx = make(1);
    ctx.register('a', ctx.calculateSince(3));
    expect(ctx.current()).toBe(1);
    ctx.setCurrent(0);
    expect(ctx.current()).toBe(1);
  });
});
