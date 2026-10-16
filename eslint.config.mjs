// ESLint settings (flat config). Three groups:
//   src            Angular app: typescript-eslint and angular-eslint
//   scripts, bin   plain Node code (.mjs): ESLint's recommended rules
//   tests          browser and unit tests: the same plain rules
import js from '@eslint/js';
import angular from 'angular-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    'dist',
    '.angular',
    'node_modules',
    '.slide-ng',
    'src/slides/generated',
    'docs/screenshots',
  ]),

  {
    files: ['src/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended, angular.configs.tsRecommended],
    languageOptions: { globals: globals.browser },
    processor: angular.processInlineTemplates,
    rules: {
      // Directives such as v-click and v-drag need an attribute name that differs from the input.
      '@angular-eslint/no-input-rename': 'off',
      // A name that starts with an underscore is unused on purpose.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },

  {
    files: ['src/**/*.html'],
    extends: [angular.configs.templateRecommended],
  },

  {
    files: ['**/*.mjs'],
    extends: [js.configs.recommended],
    // Test files also run code inside the page, so they may use browser globals too.
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      // A name that starts with an underscore is unused on purpose.
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },

  {
    // Unit tests, and the setup files that test decks load.
    files: ['scripts/**/*.ts', 'tests/**/*.ts', 'examples/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },

  {
    // Test doubles are shaped loosely on purpose.
    files: ['**/*.spec.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
]);
