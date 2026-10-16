// A theme or addon that is not installed: the install command, and (in a terminal only) the question
// "install it now?", as in Slidev. Without a terminal the error stops the run and names the command.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';

// The package manager is guessed from the lock file in the deck's folder; npm when there is none.
const MANAGERS = [
  ['pnpm-lock.yaml', 'pnpm', 'add -D'],
  ['yarn.lock', 'yarn', 'add -D'],
  ['bun.lock', 'bun', 'add -d'],
  ['bun.lockb', 'bun', 'add -d'],
];

/** `{ command: 'npm install -D @slide-ng/theme-x', file, args }` for a package, run in the deck's folder. */
export function installCommand(deckRoot, pkg) {
  const [, file, verb] = MANAGERS.find(([lock]) => existsSync(join(deckRoot, lock))) ?? ['', 'npm', 'install -D'];
  const args = [...verb.split(' '), pkg];
  return { command: `${file} ${args.join(' ')}`, file, args };
}

async function askYesNo(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(`${question} (Y/n) `)).trim().toLowerCase();
  rl.close();
  return answer === '' || answer === 'y' || answer === 'yes';
}

/**
 * Offers to install the package named by a `RootNotFoundError`. True when it was installed (try again),
 * false when nothing was installed (the caller rethrows the error). `isTTY`, `ask` and `run` can be replaced in tests.
 */
export async function offerInstall(error, deckRoot, {
  isTTY = Boolean(process.stdin.isTTY) && !process.env.CI,
  ask = askYesNo,
  run = (file, args) => spawnSync(file, args, { cwd: deckRoot, stdio: 'inherit' }).status === 0,
} = {}) {
  if (!isTTY) return false;
  const where = 'in your project';
  if (!(await ask(`The ${error.kind} "${error.spec}" was not found ${where}, do you want to install it now?`))) return false;
  const { file, args } = installCommand(deckRoot, error.pkg);
  return run(file, args);
}
