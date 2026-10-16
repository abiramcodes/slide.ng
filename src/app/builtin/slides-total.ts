import { Component, inject } from '@angular/core';
import { Nav } from '../lib/nav';

// <slides-total /> shows how many slides the deck has.
@Component({ selector: 'slides-total', template: '{{ nav.total }}' })
export class SlidesTotal {
  protected nav = inject(Nav);
}
