import {
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { hideIdleCursor } from './idle-cursor';

describe('hideIdleCursor', () => {
  it('hides the cursor when idle and stops listening when its owner is destroyed', () => {
    vi.useFakeTimers();
    const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
    runInInjectionContext(injector, () => hideIdleCursor(() => true));
    document.body.dispatchEvent(new Event('pointermove'));
    vi.advanceTimersByTime(2100);
    expect(document.body.style.cursor).toBe('none');
    injector.destroy();
    expect(document.body.style.cursor).toBe('');
    document.body.dispatchEvent(new Event('pointermove'));
    vi.advanceTimersByTime(2100);
    expect(document.body.style.cursor).toBe('');
    vi.useRealTimers();
  });
});
