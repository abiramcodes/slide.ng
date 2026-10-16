import { Component, input, isDevMode } from '@angular/core';

// Shown when a slide fails to render. The texts are Slidev's: with a dev server there is a terminal to look at, in a static build only the network.
export const ERROR_TEXT_DEV =
  'An error occurred on this slide. Check the terminal for more information.';
export const ERROR_TEXT_BUILD = 'Failed to fetch this slide. Please check your network connection.';
@Component({
  selector: 'sn-error',
  host: {
    class: 'block px-4 py-10 text-center text-red-700 dark:text-red-500 font-bold font-mono',
  },
  template: '{{ message() }}',
})
export class ErrorLayout {
  message = input(isDevMode() ? ERROR_TEXT_DEV : ERROR_TEXT_BUILD);
}
