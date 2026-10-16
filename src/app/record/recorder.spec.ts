import { afterEach, describe, expect, it, vi } from 'vitest';
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

  it('goes back to idle and stops the tracks when saving fails', async () => {
    let stopped = 0;
    const track = { stop: () => stopped++ };
    const stream = { getTracks: () => [track], getVideoTracks: () => [], getAudioTracks: () => [] };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => stream,
        getDisplayMedia: async () => stream,
      },
    });
    class FakeRecorder {
      static isTypeSupported = () => false;
      mimeType = 'video/webm';
      state = 'recording';
      onstop: () => void = () => {};
      ondataavailable = () => {};
      start() {}
      stop() {
        this.state = 'inactive';
        this.onstop();
      }
    }
    vi.stubGlobal('MediaRecorder', FakeRecorder);
    vi.stubGlobal(
      'MediaStream',
      class {
        getVideoTracks = () => [];
      },
    );
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
      throw new Error('no url');
    });
    const recorder = TestBed.inject(Recorder);
    recorder.source.set('screen');
    await recorder.start();
    expect(recorder.state()).toBe('recording');
    recorder.stop();
    await vi.waitFor(() => expect(recorder.state()).toBe('idle'));
    expect(stopped).toBeGreaterThan(0);
    expect(recorder.error()).toBe('no url');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
});
