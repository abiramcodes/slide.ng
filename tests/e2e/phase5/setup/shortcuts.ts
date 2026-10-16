import type { Shortcut, ShortcutActions } from 'slide-ng/lib/shortcuts';

// Shortcuts: the default list plus the key x.
export default (_actions: ShortcutActions, list: Shortcut[]): Shortcut[] => [
  ...list,
  { name: 'mark', key: 'x', run: () => void (document.documentElement.dataset['shortcut'] = 'pressed') },
];
