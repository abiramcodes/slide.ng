import { Injectable, effect, signal, untracked } from '@angular/core';
import { storedSignal } from '../lib/stored-signal';
import { recordEnabled } from './config';

/**
 * Camera and microphone choices, and the live camera picture for the bubble.
 * The browser asks for permission only when the camera is switched on.
 */
@Injectable({ providedIn: 'root' })
export class Devices {
  readonly cameras = signal<MediaDeviceInfo[]>([]);
  readonly mics = signal<MediaDeviceInfo[]>([]);
  /** '' = the browser's default device. */
  readonly cameraId = storedSignal('slidev-camera', '');
  readonly micId = storedSignal('slidev-mic', '');
  readonly cameraOn = storedSignal('slidev-webcam-enabled', false);
  readonly mirror = storedSignal('slidev-webcam-mirror', false);
  /** The picture the bubble shows; null while the camera is off or not allowed. */
  readonly stream = signal<MediaStream | null>(null);
  readonly error = signal('');
  readonly available = recordEnabled() && !!navigator.mediaDevices;

  constructor() {
    if (!this.available) return;
    navigator.mediaDevices.addEventListener?.('devicechange', () => this.refresh());
    // Open or close the camera whenever the switch or the chosen device changes.
    effect(() => {
      const on = this.cameraOn(),
        id = this.cameraId();
      // Only the switch and the device choice start this; reading the stream here must not.
      untracked(() => {
        this.close();
        if (on) void this.open(id);
      });
    });
  }

  /** The `video:` / `audio:` part of a getUserMedia call for the chosen devices. */
  constraint(id: string): MediaTrackConstraints | true {
    return id ? { deviceId: { exact: id } } : true;
  }

  private async open(id: string) {
    this.error.set('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: this.constraint(id),
        audio: false,
      });
      // The switch may have been turned off while the browser was asking.
      if (!this.cameraOn()) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      this.stream.set(stream);
      await this.refresh(); // device names are only known after permission
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'camera not available');
      this.cameraOn.set(false);
    }
  }

  private close() {
    this.stream()
      ?.getTracks()
      .forEach((t) => t.stop());
    this.stream.set(null);
  }

  async refresh() {
    const all = await navigator.mediaDevices.enumerateDevices();
    this.cameras.set(all.filter((d) => d.kind === 'videoinput'));
    this.mics.set(all.filter((d) => d.kind === 'audioinput'));
  }

  toggleCamera() {
    this.cameraOn.update((v) => !v);
  }
}
