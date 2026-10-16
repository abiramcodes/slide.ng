// UnoCSS settings. Called from scripts/lib/make-css.mjs.
//   - preset-wind3: the usual utility classes (flex, px-4, text-center, ...); `dark:` follows the `dark` class on <html>.
//   - preset-icons: `i-carbon:maximize` style icons from the Carbon set (the same icons Slidev uses).
//   - shortcuts: a few of Slidev's names (bg-main, text-primary, z-nav, ...).
import { presetIcons } from '@unocss/preset-icons';
import { presetWind3 } from '@unocss/preset-wind3';

export default {
  presets: [
    presetWind3({ dark: 'class' }),
    presetIcons({
      scale: 1.2,
      extraProperties: { display: 'inline-block', 'vertical-align': 'middle' },
    }),
  ],
  shortcuts: {
    'bg-main': 'bg-white dark:bg-[#121212]',
    'bg-active': 'bg-gray-400/10',
    'border-main': 'border-gray/20',
    'text-main': 'text-[#181818] dark:text-[#ddd]',
    'text-primary': 'color-$slidev-theme-primary',
    'border-primary': 'border-$slidev-theme-primary',
    'z-menu': 'z-20',
    'z-nav': 'z-50',
    'z-context-menu': 'z-60',
    'z-modal': 'z-70',
    'slidev-glass-effect': 'shadow-xl backdrop-blur-8 border border-main bg-main bg-opacity-75!',
  },
  // `forward:` and `backward:` only apply while navigating in that direction (the deck sets the class).
  variants: [
    (matcher) => {
      const dir = ['forward', 'backward'].find((d) => matcher.startsWith(`${d}:`));
      if (!dir) return matcher;
      return {
        matcher: matcher.slice(dir.length + 1),
        selector: (s) => `.slidev-nav-go-${dir} ${s}`,
      };
    },
  ],
  safelist: ['!opacity-0'],
};
