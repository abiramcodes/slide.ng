import { effect } from '@angular/core';

const DELAY = 2000;

// Hides the mouse cursor after 2 seconds without movement, while `enabled()` is true.
// Call it once, in an injection context (a constructor).
export function hideIdleCursor(enabled: () => boolean) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const show = () => { document.body.style.cursor = ''; };
  const onMove = () => {
    show();
    clearTimeout(timer);
    if (enabled()) timer = setTimeout(() => { document.body.style.cursor = 'none'; }, DELAY);
  };
  document.body.addEventListener('pointermove', onMove, { passive: true });
  // Turned off in the settings: bring the cursor back at once.
  effect(() => { if (!enabled()) { clearTimeout(timer); show(); } });
}
