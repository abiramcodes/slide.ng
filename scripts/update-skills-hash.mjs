// Records the hashes of the documents the agent skill is written from. Run it only after the skill has been
// checked against them: it is what tells check-skills-drift that the skill is up to date again.
// Usage: node scripts/update-skills-hash.mjs [--root <repository folder>]   (npm run update:skills-hash)
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { GENERATION_FILE, checkDrift, updatedGeneration } from './skills/hash.mjs';

const at = process.argv.indexOf('--root');
const root = resolve(at > 0 ? process.argv[at + 1] : '.');
const before = checkDrift(root);
writeFileSync(join(root, GENERATION_FILE), updatedGeneration(root));
const names = before.stale.map((s) => s.file.replace('skills/slide-ng/', ''));
console.log(
  names.length
    ? `Updated the hashes of ${names.length} skill files: ${names.slice(0, 5).join(', ')}${names.length > 5 ? ', ...' : ''}`
    : 'The hashes were already up to date.',
);
