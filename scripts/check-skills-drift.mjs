// Fails (exit code 1) when a document that the agent skill was written from changed after the skill's recorded hash.
// Usage: node scripts/check-skills-drift.mjs [--root <repository folder>]   (npm run check:skills)
import { resolve } from 'node:path';
import { checkDrift, describeDrift } from './skills/hash.mjs';

const at = process.argv.indexOf('--root');
const root = resolve(at > 0 ? process.argv[at + 1] : '.');
const result = checkDrift(root);
if (result.stale.length || result.problems.length) {
  console.error(describeDrift(result));
  process.exit(1);
}
console.log('The agent skill matches the documents it was written from.');
