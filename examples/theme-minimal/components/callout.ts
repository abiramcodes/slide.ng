import { Component, input } from '@angular/core';

// A highlighted box that slides can use as <minimal-callout title="Note">text</minimal-callout>.
@Component({
  selector: 'minimal-callout',
  host: { class: 'minimal-callout' },
  template: '<strong class="minimal-callout-title">{{ title() }}</strong><div><ng-content /></div>',
})
export class MinimalCallout {
  title = input('Note');
}
