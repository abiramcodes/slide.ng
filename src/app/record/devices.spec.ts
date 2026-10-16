import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Devices } from './devices';

describe('Devices', () => {
  afterEach(() => vi.restoreAllMocks());

  it('stops a camera picture that arrives after a newer request', async () => {
    const stopped: string[] = [];
    const fake = (name: string) => ({ getTracks: () => [{ stop: () => stopped.push(name) }] });
    const pending: Array<(s: unknown) => void> = [];
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: () => new Promise((resolve) => pending.push(resolve)),
        enumerateDevices: async () => [],
      },
    });
    const devices = TestBed.runInInjectionContext(() => new Devices());
    const open = (id: string) =>
      (devices as unknown as { open(id: string): Promise<void> }).open(id);
    devices.cameraOn.set(true);
    const first = open('a');
    const second = open('b');
    pending[1](fake('b'));
    await second;
    pending[0](fake('a'));
    await first;
    expect(stopped).toEqual(['a']);
  });
});
