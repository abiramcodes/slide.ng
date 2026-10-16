// The `dev` command (the default one): generate the slides, then keep three things running:
//   1. the generator in watch mode (slides.md -> components, class names -> CSS file)
//   2. the companion server (scripts/dev/server.mjs): writes slides.md and drawings, passes sync messages
//   3. the Angular dev server, which sends `/__slide-ng/*` to the companion (proxy.conf.mjs)
//   slide-ng [dev] [slides.md] [--port 4200] [--open] [--remote[=password]] [--bind 0.0.0.0] [--log info] [--force]
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { hostname, networkInterfaces } from 'node:os';
import { join, resolve } from 'node:path';
import { randomSecret } from '../dev/config.mjs';
import { ngBinary, prepareApp } from './app-root.mjs';
import { applyThemeFlag, parseFlags } from './flags.mjs';
import { packageRoot } from './package-root.mjs';

export const DEV_FLAGS = {
  port: { type: 'number', alias: 'p' },
  open: { type: 'boolean', alias: 'o' },
  remote: { type: 'optional' },
  bind: { type: 'string' },
  log: { type: 'string' },
  force: { type: 'boolean', alias: 'f' },
  tunnel: { type: 'optional' },
  base: { type: 'string' },
  theme: { type: 'string', alias: 't' },
};

const LOG_LEVELS = ['error', 'warn', 'info', 'silent'];

/** Checks the flags and returns the plan for the three processes. Pure, so it can be tested without starting anything. */
export function devPlan(argv) {
  const { flags, positionals } = parseFlags(argv, DEV_FLAGS);
  if (flags.tunnel) throw new Error('--tunnel is not available (it needs a tunnel service; use --remote on your network instead)');
  if (flags.base) throw new Error('--base is for `slide-ng build`; the dev server always runs at /');
  const log = flags.log ?? 'info';
  if (!LOG_LEVELS.includes(log)) throw new Error(`--log must be one of ${LOG_LEVELS.join(', ')}, got "${log}"`);
  const remote = Boolean(flags.remote);
  // Never open to the network without a password.
  const password = remote ? (typeof flags.remote === 'string' && flags.remote ? flags.remote : randomBytes(6).toString('hex')) : '';
  const host = flags.bind ?? (remote ? '0.0.0.0' : undefined);
  // SLIDES_FILE is how tests (and older scripts) pick another deck.
  const entry = resolve(positionals[0] ?? process.env.SLIDES_FILE ?? 'slides.md');
  return { entry, port: flags.port ?? 4200, open: Boolean(flags.open), remote, password, host, log, force: Boolean(flags.force), theme: flags.theme };
}

// A free port for the companion server (it only listens on this machine).
const freePort = () => new Promise((done) => {
  const s = createServer().listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => done(port)); });
});

export async function devCommand(argv) {
  const plan = devPlan(argv);
  applyThemeFlag(plan);
  const appRoot = prepareApp(plan.entry);
  if (plan.force) rmSync(join(appRoot, '.angular', 'cache'), { recursive: true, force: true }); // the build cache is the only thing --force clears
  const companionPort = process.env.SLIDE_NG_DEV_PORT || String(await freePort());

  const env = {
    ...process.env, SLIDES_FILE: plan.entry,
    SLIDE_NG_DEV_PORT: companionPort,
    SLIDE_NG_TOKEN: randomSecret(),
    SLIDE_NG_REMOTE: plan.remote ? '1' : '0',
    SLIDE_NG_PASSWORD: plan.password,
    SLIDE_NG_HOSTNAMES: plan.remote ? [hostname(), `${hostname()}.local`].join(',') : '',
  };
  const generate = join(packageRoot, 'scripts/generate.mjs');
  const first = spawnSync(process.execPath, [generate], { cwd: appRoot, env, stdio: 'inherit' });
  if (first.status !== 0) throw new Error('generating the slides failed');

  // With --log error or silent the children's normal output is dropped; their errors still show.
  const quiet = plan.log === 'error' || plan.log === 'silent';
  const stdio = quiet ? ['ignore', 'ignore', 'inherit'] : 'inherit';
  const ngArgs = [ngBinary(), 'serve', '--port', String(plan.port)];
  if (plan.host) ngArgs.push('--host', plan.host);
  if (plan.open) ngArgs.push('--open');
  const children = [
    spawn(process.execPath, [generate, '--watch'], { cwd: appRoot, env, stdio }),
    spawn(process.execPath, [join(packageRoot, 'scripts/dev/server.mjs')], { cwd: appRoot, env, stdio }),
    spawn(process.execPath, ngArgs, { cwd: appRoot, env, stdio }),
  ];
  const stopAll = () => children.forEach((c) => c.kill());
  children[2].on('exit', (code) => { stopAll(); process.exit(code ?? 0); });
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { stopAll(); process.exit(0); });

  if (plan.remote) {
    const lan = Object.values(networkInterfaces()).flat().find((i) => i && i.family === 'IPv4' && !i.internal)?.address ?? '<your address>';
    console.log(`\n[slide.ng] remote access is ON. Others on your network need the password: ${plan.password}`);
    console.log(`[slide.ng]   deck:      http://${lan}:${plan.port}/`);
    console.log(`[slide.ng]   presenter: http://${lan}:${plan.port}/presenter/1?password=${plan.password}\n`);
  }
}
