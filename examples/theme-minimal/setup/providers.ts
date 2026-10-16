import type { Provider } from '@angular/core';
import { SHORTCUTS_SETUP, type Shortcut, type ShortcutActions } from 'slide-ng/lib/shortcuts';

// Setup hooks are Angular providers. This one adds a key to the shortcut list: `b` goes back one slide
// (the list the app made is the second argument, and what this returns is what is used).
const providers: Provider[] = [
  {
    provide: SHORTCUTS_SETUP,
    useValue: (actions: ShortcutActions, list: Shortcut[]): Shortcut[] => [
      ...list,
      { name: 'minimal_back', key: 'b', run: actions.prevSlide },
    ],
  },
];

export default providers;
