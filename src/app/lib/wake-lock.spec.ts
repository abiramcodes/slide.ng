import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { WakeLock } from './wake-lock';

describe('WakeLock', () => {
  it('lets go of a lock that arrives after the setting was switched off', async () => {
    let released = 0;
    let answer!: (s: unknown) => void;
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: { request: () => new Promise((r) => (answer = r)) },
    });
    const lock = TestBed.inject(WakeLock);
    lock.enabled.set(true);
    TestBed.tick();
    lock.enabled.set(false);
    TestBed.tick();
    answer({ addEventListener() {}, release: async () => released++ });
    await new Promise((r) => setTimeout(r, 0));
    expect(released).toBe(1);
    expect(lock.held()).toBe(false);
    delete (navigator as { wakeLock?: unknown }).wakeLock;
  });
});
