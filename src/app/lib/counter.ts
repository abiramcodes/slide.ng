import { Component, OnInit, input, output, signal } from '@angular/core';

// An example of a custom component that slides can use: <app-counter [start]="5" />
@Component({
  selector: 'app-counter',
  template: `<button id="ctr" class="px-4 py-1 rounded bg-blue-600 text-white" (click)="inc()">
    counter {{ n() }}
  </button>`,
})
export class Counter implements OnInit {
  start = input(0);
  changed = output<number>();
  n = signal(0);

  ngOnInit(): void {
    this.n.set(this.start());
  }

  inc() {
    this.n.update((v) => v + 1);
    this.changed.emit(this.n());
  }
}
