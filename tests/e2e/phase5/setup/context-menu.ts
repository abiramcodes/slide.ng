import type { ContextMenuItem } from 'slide-ng/setup';

// Context menu: one more entry at the end.
export default (items: ContextMenuItem[]): ContextMenuItem[] => [
  ...items,
  { icon: 'i-carbon:star', label: 'Setup item', run: () => void (document.documentElement.dataset['menu'] = 'clicked') },
];
