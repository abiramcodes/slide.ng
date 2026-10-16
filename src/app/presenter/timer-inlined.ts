import { Component, computed, inject } from '@angular/core';
import { Timer } from './timer';

// The clock at the bottom right of the presenter page. Hover it for pause / play and reset.
@Component({
  selector: 'app-timer-inlined',
  template: `
    <div id="timer" class="group flex items-center justify-center pl-4 select-none" [class]="color()">
      <div class="w-22px cursor-pointer">
        <div class="group-hover:hidden text-2xl" [class]="timer.mode === 'countdown' ? 'i-carbon:timer' : 'i-carbon:time'"></div>
        <div class="group-not-hover:hidden flex flex-col items-center">
          <div id="timer-toggle" class="relative op-80 hover:op-100" (click)="timer.toggle()">
            <div [class]="timer.status() === 'running' ? 'i-carbon:pause text-lg' : 'i-carbon:play'"></div>
          </div>
          <div id="timer-reset" class="op-80 hover:op-100" (click)="timer.reset()"><div class="i-carbon:renew"></div></div>
        </div>
      </div>
      <div id="timer-text" class="text-3xl px-3 my-auto font-mono">
        @if (timer.parts().h) { <span>{{ timer.parts().h }}</span><span class="op50">:</span> }
        <span>{{ timer.parts().m }}</span><span class="op50">:</span><span>{{ timer.parts().s }}</span>
      </div>
    </div>
  `,
})
export class TimerInlined {
  protected timer = inject(Timer);
  protected color = computed(() => {
    if (this.timer.status() === 'stopped') return 'op50';
    if (this.timer.status() === 'paused') return 'text-blue6 dark:text-blue3';
    const p = this.timer.percentage();
    return p > 100 ? 'text-red6 dark:text-red3' : p > 80 ? 'text-yellow6 dark:text-yellow3' : 'text-green6 dark:text-green3';
  });
}
