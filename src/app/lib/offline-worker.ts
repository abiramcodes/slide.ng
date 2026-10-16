import { isDevMode, signal } from '@angular/core';
import { PWA } from '../../slides/generated';

/** True once a worker is active, which (see sw.js) is after it has stored every file of the deck. */
export const offlineReady = signal(false);

/**
 * Registers the service worker that `slide-ng build` writes for decks with `pwa: true` (see scripts/build/pwa.mjs),
 * so the deck opens without a network after its first visit. Only in a production build; the dev server has no worker.
 */
export function registerOfflineWorker() {
  if (!PWA || isDevMode() || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready.then(() => offlineReady.set(true), () => {});
  const register = () => navigator.serviceWorker.register(new URL('sw.js', document.baseURI).href).catch(() => {});
  // Wait for the page to finish loading, so the worker's downloads do not compete with it.
  if (document.readyState === 'complete') void register();
  else window.addEventListener('load', () => void register(), { once: true });
}
