import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { Draggable } from '../drawing/draggable';
import { Devices } from './devices';

// The round camera picture that floats over the slides (Slidev's WebCamera). Drag it by its edge.
@Component({
  selector: 'app-web-camera',
  imports: [Draggable],
  template: `
    @if (devices.available && devices.cameraOn() && devices.stream()) {
      <app-draggable storageKey="slidev-camera-pos" [initialX]="20" [initialY]="20">
        <div id="web-camera" class="rounded-full overflow-hidden shadow-xl border-2 border-main bg-black w-48 h-48 cursor-move">
          <video #video autoplay muted playsinline class="w-full h-full object-cover pointer-events-none" [style.transform]="devices.mirror() ? 'scaleX(-1)' : null"></video>
        </div>
      </app-draggable>
    }
  `,
})
export class WebCamera {
  protected devices = inject(Devices);
  private video = viewChild<ElementRef<HTMLVideoElement>>('video');

  constructor() {
    // The video element appears after the stream does, so connect them whenever either changes.
    effect(() => {
      const el = this.video()?.nativeElement;
      if (el) el.srcObject = this.devices.stream();
    });
  }
}
