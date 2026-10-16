// Slide transitions. Slidev uses Vue's <Transition> and CSS classes; here the two slides
// (the one leaving and the one entering) are animated with the browser's Web Animations API.
export type TransitionSpec = string | { name?: string } | null | undefined;

// Slidev's table: a one-word name stands for "forward | backward".
const PAIRS: Record<string, string> = {
  'slide-left': 'slide-left | slide-right',
  'slide-right': 'slide-right | slide-left',
  'slide-up': 'slide-up | slide-down',
  'slide-down': 'slide-down | slide-up',
};

/** The transition name to use for this direction, or null for none. Port of Slidev's resolveTransition. */
export function resolveTransition(spec: TransitionSpec, backward: boolean): string | null {
  const wanted = typeof spec === 'string' ? spec : spec?.name;
  if (!wanted) return null;
  const pair = wanted.includes('|') ? wanted : (PAIRS[wanted] ?? wanted);
  if (!pair.includes('|')) return pair;
  const [forward, back] = pair.split('|').map((s) => s.trim());
  return (backward ? back : forward) || null;
}

/**
 * Which transition applies between two slides. Like Slidev, the one set on the earlier
 * slide counts (going on from slide 3 to 4, and back from 4 to 3, both use slide 3's setting).
 */
export function pickTransition(
  slides: { transition: TransitionSpec }[],
  from: number,
  to: number,
  deckDefault: TransitionSpec,
): string | null {
  if (from === to) return null;
  const earlier = slides[Math.min(from, to) - 1]?.transition ?? deckDefault;
  return resolveTransition(earlier, to < from);
}

interface Pair { enter: Keyframe[]; leave: Keyframe[]; enterOptions?: KeyframeAnimationOptions; leaveOptions?: KeyframeAnimationOptions }

// What each transition does, written from Slidev's transitions.css. `ms` is the duration.
export function animationsFor(name: string, ms: number): Pair | null {
  const slide = (from: string, to: string): Pair => ({
    enter: [{ translate: from }, { translate: '0 0' }],
    leave: [{ translate: '0 0' }, { translate: to }],
  });
  switch (name) {
    case 'slide-left': return slide('100% 0', '-100% 0');
    case 'slide-right': return slide('-100% 0', '100% 0');
    case 'slide-up': return slide('0 100%', '0 -100%');
    case 'slide-down': return slide('0 -100%', '0 100%');
    case 'fade': return { enter: [{ opacity: 0 }, { opacity: 1 }], leave: [{ opacity: 1 }, { opacity: 0 }] };
    case 'fade-out': // the old slide fades out first, then the new one fades in
      return {
        enter: [{ opacity: 0 }, { opacity: 1 }],
        leave: [{ opacity: 1 }, { opacity: 0 }],
        enterOptions: { duration: ms * 0.8, delay: ms * 0.6, easing: 'ease-in' },
        leaveOptions: { duration: ms * 0.6, easing: 'ease-out' },
      };
    default: return null;
  }
}

/** The duration from the CSS variable `--slidev-transition-duration` (like `0.5s`), in milliseconds. */
export function transitionDuration(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--slidev-transition-duration').trim();
  const n = parseFloat(raw);
  return Number.isNaN(n) ? 500 : raw.endsWith('ms') ? n : n * 1000;
}
