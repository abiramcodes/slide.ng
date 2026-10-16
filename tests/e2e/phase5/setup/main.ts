import { provideEnvironmentInitializer } from '@angular/core';

// Main: extra Angular providers. This one marks the page when the app starts.
export default () => [
  provideEnvironmentInitializer(() => void (document.documentElement.dataset['main'] = 'yes')),
];
