import { Component, computed, inject } from '@angular/core';
import { Timer } from './timer';

// A coloured bar under the progress bar: how much of the planned time is used.
@Component({
  selector: 'app-timer-bar',
  template: `
    <div class="border-b mt-px border-main relative flex h-4px">
      @if (timer.status() !== 'stopped') {
        <div class="h-4px" [class]="color()" [style.width.%]="timer.percentage()"></div>
      }
    </div>
  `,
})
export class TimerBar {
  protected timer = inject(Timer);
  protected color = computed(() => {
    if (this.timer.status() === 'paused') return 'bg-blue';
    const p = this.timer.percentage();
    return p > 100 ? 'bg-red' : p > 80 ? 'bg-yellow' : 'bg-green';
  });
}
