import { Component, input } from '@angular/core';

// Shown when a slide fails to render.
@Component({
  selector: 'sn-error',
  host: { class: 'block px-4 py-10 text-center text-red-700 dark:text-red-500 font-bold font-mono' },
  template: '{{ message() }}',
})
export class ErrorLayout {
  message = input('An error occurred on this slide. Check the browser console for more information.');
}
