import { isDevMode } from '@angular/core';
import { HEADMATTER } from '../../slides/generated';

export interface DrawingsConfig {
  /** Is drawing offered at all? */
  enabled: boolean;
  /** Drawings are written to `.slide-ng/drawings/` while developing (the generator also reads them back for the build). */
  persist: boolean;
  /** Only the presenter page may draw. */
  presenterOnly: boolean;
  /** Drawings of viewers are sent to everyone (true) or stay on their own screen (false). */
  syncAll: boolean;
}

/** The headmatter `drawings:` block with Slidev's defaults. `enabled` may be `dev` or `build` to limit it to development or to the built deck. */
export function readDrawingsConfig(
  headmatter: Record<string, unknown>,
  dev: boolean,
): DrawingsConfig {
  const raw = (headmatter['drawings'] ?? {}) as Record<string, unknown>;
  const enabled = raw['enabled'];
  return {
    enabled:
      enabled === false ? false : enabled === 'dev' ? dev : enabled === 'build' ? !dev : true,
    persist: !!raw['persist'],
    presenterOnly: !!raw['presenterOnly'],
    syncAll: raw['syncAll'] !== false,
  };
}

export const drawingsConfig = (): DrawingsConfig => readDrawingsConfig(HEADMATTER, isDevMode());
