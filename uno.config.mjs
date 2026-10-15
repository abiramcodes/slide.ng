// UnoCSS settings. `preset-wind3` gives the usual utility classes (flex, px-4, text-center, ...).
// To add your own shortcuts or colors, extend this config; scripts/lib/make-css.mjs reads it.
import { presetWind3 } from '@unocss/preset-wind3';

export default {
  presets: [presetWind3()],
};
