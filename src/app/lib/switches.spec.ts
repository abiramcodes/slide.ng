import { describe, expect, it } from 'vitest';
import { readSwitch } from './switches';

describe('readSwitch', () => {
  it('is on when not set, or null', () => {
    expect(readSwitch(undefined, true)).toBe(true);
    expect(readSwitch(null, false)).toBe(true);
  });
  it('follows true and false', () => {
    expect(readSwitch(true, false)).toBe(true);
    expect(readSwitch(false, true)).toBe(false);
  });
  it('turns on in one mode only for dev and build', () => {
    expect(readSwitch('dev', true)).toBe(true);
    expect(readSwitch('dev', false)).toBe(false);
    expect(readSwitch('build', false)).toBe(true);
    expect(readSwitch('build', true)).toBe(false);
  });
});
