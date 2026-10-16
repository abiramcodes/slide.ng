import { Component, inject } from '@angular/core';
import { Ui } from '../lib/ui-state';
import { DevicesSelectors } from '../record/devices-selectors';

// The content of the settings menu: a small part of Slidev's (slide scale and idle cursor).
@Component({
  selector: 'app-settings',
  imports: [DevicesSelectors],
  template: `
    <div class="text-sm select-none flex flex-col gap-1 min-w-30 px-4">
      <div class="flex items-center gap-4">
        <span class="mr-auto">Slide Scale</span>
        <div class="flex rounded border border-main overflow-hidden">
          <button type="button" id="scale-fit" class="px-2 py-0.5" [class.bg-active]="!ui.slideScale()" (click)="ui.slideScale.set(0)">Fit</button>
          <button type="button" id="scale-1" class="px-2 py-0.5" [class.bg-active]="ui.slideScale() === 1" (click)="ui.slideScale.set(1)">1:1</button>
        </div>
      </div>
      <label class="flex items-center gap-4 cursor-pointer">
        <span class="mr-auto">Hide Idle Cursor</span>
        <input type="checkbox" id="hide-idle-cursor" [checked]="ui.hideIdleCursor()" (change)="ui.hideIdleCursor.set(!ui.hideIdleCursor())" />
      </label>
      <app-devices-selectors />
    </div>
  `,
})
export class Settings {
  protected ui = inject(Ui);
}
