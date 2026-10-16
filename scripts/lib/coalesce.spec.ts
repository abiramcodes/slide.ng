import { describe, expect, it } from 'vitest';
import { coalesce } from './coalesce.mjs';

describe('coalesce', () => {
  it('never overlaps runs and joins calls made during one into a single rerun', async () => {
    let active = 0;
    let peak = 0;
    let runs = 0;
    const gates: Array<() => void> = [];
    const run = coalesce(async () => {
      runs++;
      active++;
      peak = Math.max(peak, active);
      await new Promise<void>((r) => gates.push(r));
      active--;
    });
    const first = run();
    void run();
    void run();
    gates[0]();
    await new Promise((r) => setTimeout(r, 0));
    gates[1]();
    await first;
    expect(runs).toBe(2);
    expect(peak).toBe(1);
  });
  it('keeps going after a failed run', async () => {
    let n = 0;
    const run = coalesce(async () => {
      if (n++ === 0) throw new Error('boom');
    });
    await expect(run()).rejects.toThrow('boom');
    await run();
    expect(n).toBe(2);
  });
});
