import { Component } from '@angular/core';

// Introduce the talk: title, short description, author.
@Component({
  selector: 'sn-intro',
  host: { class: 'slidev-layout intro' },
  template: '<div class="my-auto"><ng-content /></div>',
})
export class IntroLayout {}
