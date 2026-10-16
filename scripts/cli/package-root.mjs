// The folder of this package: `src/` (the app), `scripts/` (the generator), `angular.json`, `template/`.
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
