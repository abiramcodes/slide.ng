import { Component, inject } from '@angular/core';
import { Devices } from './devices';
import { Recorder } from './recorder';

// Settings entries for camera, microphone, mirroring and what the recording captures.
@Component({
  selector: 'app-devices-selectors',
  template: `
    @if (devices.available) {
      <div class="flex flex-col gap-1 text-sm">
        <label class="flex items-center gap-4">
          <span class="mr-auto">Camera</span>
          <select id="camera-select" class="bg-main border border-main rounded max-w-40" [value]="devices.cameraId()" (change)="devices.cameraId.set($any($event.target).value)" (focus)="devices.refresh()">
            <option value="">Default</option>
            @for (d of devices.cameras(); track d.deviceId) { <option [value]="d.deviceId">{{ d.label || 'Camera' }}</option> }
          </select>
        </label>
        <label class="flex items-center gap-4">
          <span class="mr-auto">Microphone</span>
          <select id="mic-select" class="bg-main border border-main rounded max-w-40" [value]="devices.micId()" (change)="devices.micId.set($any($event.target).value)" (focus)="devices.refresh()">
            <option value="">Default</option>
            @for (d of devices.mics(); track d.deviceId) { <option [value]="d.deviceId">{{ d.label || 'Microphone' }}</option> }
          </select>
        </label>
        <label class="flex items-center gap-4 cursor-pointer">
          <span class="mr-auto">Mirror camera</span>
          <input type="checkbox" id="camera-mirror" [checked]="devices.mirror()" (change)="devices.mirror.set(!devices.mirror())" />
        </label>
        <div class="flex items-center gap-4">
          <span class="mr-auto">Record</span>
          <div class="flex rounded border border-main overflow-hidden">
            <button type="button" id="record-screen" class="px-2 py-0.5" [class.bg-active]="recorder.source() === 'screen'" (click)="recorder.source.set('screen')">Screen</button>
            <button type="button" id="record-camera" class="px-2 py-0.5" [class.bg-active]="recorder.source() === 'camera'" (click)="recorder.source.set('camera')">Camera</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DevicesSelectors {
  protected devices = inject(Devices);
  protected recorder = inject(Recorder);
}
