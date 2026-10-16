import { TestBed } from '@angular/core/testing';
import { Recorder } from './recorder';

describe('Recorder', () => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');
  afterEach(() => {
    if (original) Object.defineProperty(navigator, 'mediaDevices', original);
    else delete (navigator as { mediaDevices?: unknown }).mediaDevices;
  });

  it('stops the microphone when the screen picker is cancelled', async () => {
    let stopped = 0;
    const micStream = { getTracks: () => [{ stop: () => stopped++ }] };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => micStream,
        getDisplayMedia: async () => {
          throw new Error('Permission denied');
        },
      },
    });
    const recorder = TestBed.inject(Recorder);
    recorder.source.set('screen');
    await recorder.start();
    expect(stopped).toBe(1);
    expect(recorder.state()).toBe('idle');
    expect(recorder.error()).toBe('Permission denied');
  });
});
