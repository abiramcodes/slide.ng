#!/usr/bin/env node
// The command line of slide.ng. For now: export. The other commands are added in the same file.
import { exportCommand } from '../scripts/cli/export.mjs';

const [command, ...args] = process.argv.slice(2);
try {
  if (command === 'export') await exportCommand(args);
  else if (command === 'export-notes') await exportCommand(args, { notes: true });
  else throw new Error(`Unknown command "${command ?? ''}"`);
} catch (error) {
  console.error(`slide-ng: ${error.message}`);
  process.exitCode = 1;
}
