import { Component } from '@angular/core';
import { VDrag } from './v-drag';

// `<v-drag pos="x,y,w,h">...</v-drag>`: the same as `<div v-drag="[x, y, w, h]">...</div>`.
@Component({
  selector: 'v-drag',
  hostDirectives: [{ directive: VDrag, inputs: ['v-drag: pos', 'drag-site'] }],
  host: { style: 'display: block' },
  template: '<ng-content />',
})
export class VDragBox {}
