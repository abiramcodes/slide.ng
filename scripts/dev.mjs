// `npm start`: the same as `slide-ng dev` (see scripts/cli/dev.mjs). Kept so `npm start -- --remote` keeps working.
import { devCommand } from './cli/dev.mjs';

try {
  await devCommand(process.argv.slice(2));
} catch (error) {
  console.error(`slide-ng: ${error.message}`);
  process.exitCode = 1;
}
