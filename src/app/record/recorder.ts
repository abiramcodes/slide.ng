import { Injectable, computed, inject, signal } from '@angular/core';
import { HEADMATTER } from '../../slides/generated';
import { storedSignal } from '../lib/stored-signal';
import { Devices } from './devices';
import { pickMimeType, recordingName } from './recording-file';
import { fixWebmDuration } from './webm-duration';

export type RecordingState = 'idle' | 'recording' | 'paused';

/**
 * Records with the browser's own MediaRecorder and offers the result as a .webm download.
 * `screen` records this tab (the browser asks which), `camera` records the camera.
 * Both add the microphone. MediaRecorder writes no duration, so the saved file gets one (`webm-duration.ts`), as in Slidev.
 */
@Injectable({ providedIn: 'root' })
export class Recorder {
  private devices = inject(Devices);
  readonly source = storedSignal<'screen' | 'camera'>('slidev-record-source', 'screen');
  readonly state = signal<RecordingState>('idle');
  readonly error = signal('');
  /** Seconds recorded so far (not counting pauses). */
  readonly seconds = signal(0);
  /** Size in bytes of the last finished recording, 0 before the first. */
  readonly lastSize = signal(0);
  readonly active = computed(() => this.state() !== 'idle');

  private recorder: MediaRecorder | null = null;
  private opened: MediaStream[] = [];
  private chunks: Blob[] = [];
  private timer = 0;
  // Recorded time in milliseconds, not counting pauses: the length the saved file is given.
  private startedAt = 0;
  private pausedAt = 0;
  private pausedTotal = 0;

  async start() {
    if (this.active()) return;
    this.error.set('');
    try {
      const stream = await this.makeStream();
      const mimeType = pickMimeType((t) => MediaRecorder.isTypeSupported(t));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      this.chunks = [];
      recorder.ondataavailable = (e) => { if (e.data.size) this.chunks.push(e.data); };
      recorder.onstop = () => this.finish(recorder.mimeType);
      // The user ending the share from the browser's own bar also ends the recording.
      stream.getVideoTracks()[0]?.addEventListener('ended', () => this.stop());
      recorder.start(1000);
      this.recorder = recorder;
      this.startedAt = performance.now();
      this.pausedTotal = 0;
      this.seconds.set(0);
      this.state.set('recording');
      this.timer = window.setInterval(() => { if (this.state() === 'recording') this.seconds.update((s) => s + 1); }, 1000);
    } catch (e) {
      this.release();
      this.error.set(e instanceof Error ? e.message : 'recording failed');
    }
  }

  stop() {
    if (this.recorder?.state !== 'inactive') this.recorder?.stop();
  }

  togglePause() {
    if (this.state() === 'recording') { this.recorder?.pause(); this.pausedAt = performance.now(); this.state.set('paused'); }
    else if (this.state() === 'paused') { this.recorder?.resume(); this.pausedTotal += performance.now() - this.pausedAt; this.state.set('recording'); }
  }

  private async makeStream(): Promise<MediaStream> {
    const mic = await navigator.mediaDevices.getUserMedia({ audio: this.devices.constraint(this.devices.micId()), video: false }).catch(() => null);
    const video = this.source() === 'camera'
      ? await navigator.mediaDevices.getUserMedia({ video: this.devices.constraint(this.devices.cameraId()), audio: false })
      : await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false, preferCurrentTab: true } as DisplayMediaStreamOptions);
    this.opened = [video, ...(mic ? [mic] : [])];
    return new MediaStream([...video.getVideoTracks(), ...(mic?.getAudioTracks() ?? [])]);
  }

  private async finish(type: string) {
    if (this.state() === 'paused') this.pausedTotal += performance.now() - this.pausedAt;
    const elapsed = performance.now() - this.startedAt - this.pausedTotal;
    const blob = await fixWebmDuration(new Blob(this.chunks, { type: type || 'video/webm' }), elapsed);
    this.lastSize.set(blob.size);
    // A click on a temporary link is how a page starts a download.
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = recordingName(String(HEADMATTER['title'] ?? 'slides'), new Date());
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
    this.release();
  }

  private release() {
    clearInterval(this.timer);
    this.opened.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    this.opened = [];
    this.recorder = null;
    this.state.set('idle');
  }
}
