import { Component, inject } from '@angular/core';
import { Filters, defaultFilters } from '../lib/filters';
import { ViewPrefs } from '../lib/view-prefs';

// The five sliders of the slide colour filter.
@Component({
  selector: 'app-filter-settings',
  template: `
    @for (f of fields; track f.key) {
      <label class="flex items-center gap-2">
        <span class="mr-auto">{{ f.label }}</span>
        <input type="range" class="w-24" [id]="'filter-' + f.key" [min]="f.min" [max]="f.max" [value]="prefs.filters()[f.key]" (input)="set(f.key, +$any($event.target).value)" />
      </label>
    }
    <button type="button" id="filter-reset" class="text-xs op70 hover:op100 text-left" (click)="prefs.filters.set(defaults)">Reset filters</button>
  `,
})
export class FilterSettings {
  protected prefs = inject(ViewPrefs);
  protected defaults = defaultFilters;
  protected fields: { key: keyof Filters; label: string; min: number; max: number }[] = [
    { key: 'brightness', label: 'Brightness', min: 20, max: 200 },
    { key: 'contrast', label: 'Contrast', min: 20, max: 200 },
    { key: 'saturate', label: 'Saturation', min: 0, max: 300 },
    { key: 'grayscale', label: 'Grayscale', min: 0, max: 100 },
    { key: 'hue', label: 'Hue', min: 0, max: 360 },
  ];

  protected set(key: keyof Filters, value: number) {
    this.prefs.filters.update((f) => ({ ...f, [key]: value }));
  }
}
