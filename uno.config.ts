import { defineConfig, presetWind3 } from 'unocss';

// UnoCSS reads the class names in slides.md and the app's .ts files and
// writes only the CSS that is used, into the file listed in angular.json.
// `npm run generate` (and the dev runner) call the `unocss` command, which uses this config.
export default defineConfig({
  presets: [presetWind3()],
  cli: {
    entry: {
      patterns: ['slides.md', 'src/app/**/*.ts'],
      outFile: 'src/slides/generated/uno.css',
    },
  },
});
