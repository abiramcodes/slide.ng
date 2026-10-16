import { Component, inject, input } from '@angular/core';
import { Nav, findSlide } from '../lib/nav';

// A link to another slide of the deck: <slide-link to="3">go to slide 3</slide-link>.
// `to` is a slide number or a `routeAlias`. (The name is not `link`, which is a built-in HTML tag.)
@Component({
  selector: 'slide-link',
  template: `<a [href]="'/' + to()" (click)="go($event)"><ng-content /></a>`,
})
export class SlideLink {
  to = input.required<string | number>();
  private nav = inject(Nav);

  go(e: Event) {
    e.preventDefault();
    const no = findSlide(
      String(this.to()),
      this.nav.total,
      this.nav.slides.map((s) => s.routeAlias),
    );
    if (no) this.nav.go(no);
    (e.target as HTMLElement).blur();
  }
}
