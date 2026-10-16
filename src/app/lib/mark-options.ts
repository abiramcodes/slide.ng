// Turns what a slide wrote (`v-mark.red.circle="2"`, `[v-mark]="{ at: 2, color: '#234' }"`)
// into one options object for rough-notation. Pure, so it is easy to test.
// Port of the modifier tables in Slidev's modules/v-mark.ts.

export interface MarkOptions {
  at: unknown; // click value, [from, to], true (always shown) or false (never)
  type?: string;
  color?: string;
  delay?: number; // ms to wait after the click (rough-notation has no delay option of its own)
  opacity?: number; // 0 to 1
  [other: string]: unknown; // anything else goes straight to rough-notation
}

const TYPES: Record<string, string> = {
  'box': 'box', 'circle': 'circle', 'underline': 'underline', 'highlight': 'highlight', 'bracket': 'bracket',
  'strike-through': 'strike-through', 'crossed-off': 'crossed-off',
  'strike': 'strike-through', 'cross': 'crossed-off', 'crossed': 'crossed-off', 'linethrough': 'strike-through', 'line-through': 'strike-through',
};

// Slidev maps these to UnoCSS `text-<name>` classes; we set the colour directly (Tailwind 500 shades).
const COLORS: Record<string, string> = {
  black: '#000000', white: '#ffffff', gray: '#6b7280', red: '#ef4444', orange: '#f97316', yellow: '#eab308',
  lime: '#84cc16', green: '#22c55e', teal: '#14b8a6', cyan: '#06b6d4', blue: '#3b82f6', indigo: '#6366f1',
  purple: '#a855f7', pink: '#ec4899',
};

/** @param value the `v-mark` value @param mods the dotted modifiers, like "red.circle.delay300" */
export function markOptions(value: unknown, mods: string): MarkOptions {
  const fromValue = value && typeof value === 'object' && !Array.isArray(value) ? { ...(value as object) } as Partial<MarkOptions> : { at: value };
  const fromMods: Partial<MarkOptions> = {};
  const unknown: string[] = [];
  for (const mod of mods.split('.').filter(Boolean)) {
    const delay = /^delay-?(\d+)?$/.exec(mod);
    const opacity = /^(?:op|opacity)-?(\d+)?$/.exec(mod);
    if (TYPES[mod]) fromMods.type = TYPES[mod];
    else if (COLORS[mod]) fromMods.color = COLORS[mod];
    else if (delay) fromMods.delay = delay[1] ? +delay[1] : 300;
    else if (opacity) fromMods.opacity = (opacity[1] ? +opacity[1] : 100) / 100;
    else unknown.push(mod);
  }
  if (unknown.length) console.warn('[slide.ng] unknown v-mark modifiers:', unknown.join(', '));
  // Options written as an object win over modifiers.
  const options = { ...fromMods, ...fromValue } as MarkOptions;
  options.type ||= 'underline';
  return options;
}
