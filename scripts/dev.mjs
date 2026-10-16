// `npm start`: generate slides, then keep three things running:
//   1. the generator in watch mode (slides.md -> components, class names -> CSS file)
//   2. the companion server (scripts/dev/server.mjs): writes slides.md and drawings, passes sync messages
//   3. the Angular dev server, which sends `/__slide-ng/*` to the companion (proxy.conf.mjs)
// Extra arguments go to `ng serve`, e.g. `npm start -- --port 4300`.
//
// `npm start -- --remote` lets other devices on your network open the deck and join the presenter
// (it makes the dev server listen on all addresses). They need a password: `--remote=secret`, or a random one is made and printed.
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';
import { hostname, networkInterfaces } from 'node:os';
import { randomSecret } from './dev/config.mjs';

// ---- arguments: --remote and --remote=password are ours, the rest is for ng serve
const rest = [];
let remote = false, password = '';
for (const arg of process.argv.slice(2)) {
  if (arg === '--remote') remote = true;
  else if (arg.startsWith('--remote=')) { remote = true; password = arg.slice('--remote='.length); }
  else rest.push(arg);
}
if (remote && !password) password = randomBytes(6).toString('hex'); // never open to the network without one
const portArg = rest.findIndex((a) => a === '--port' || a.startsWith('--port='));
const port = portArg < 0 ? 4200 : Number(rest[portArg].includes('=') ? rest[portArg].split('=')[1] : rest[portArg + 1]);
if (remote && !rest.some((a) => a === '--host' || a.startsWith('--host='))) rest.push('--host', '0.0.0.0');

// A free port for the companion server (it only listens on this machine).
const freePort = () => new Promise((resolve) => {
  const s = createServer().listen(0, '127.0.0.1', () => { const { port: p } = s.address(); s.close(() => resolve(p)); });
});
const companionPort = process.env.SLIDE_NG_DEV_PORT || String(await freePort());

execFileSync('node', ['scripts/generate.mjs'], { stdio: 'inherit' });

const env = {
  ...process.env,
  SLIDE_NG_DEV_PORT: companionPort,
  SLIDE_NG_TOKEN: randomSecret(),
  SLIDE_NG_REMOTE: remote ? '1' : '0',
  SLIDE_NG_PASSWORD: password,
  SLIDE_NG_HOSTNAMES: remote ? [hostname(), `${hostname()}.local`].join(',') : '',
};
const children = [
  spawn('node', ['scripts/generate.mjs', '--watch'], { stdio: 'inherit' }),
  spawn('node', ['scripts/dev/server.mjs'], { stdio: 'inherit', env }),
  spawn(process.execPath, ['node_modules/@angular/cli/bin/ng.js', 'serve', ...rest], { stdio: 'inherit', env }),
];
const stopAll = () => children.forEach((c) => c.kill());
children[2].on('exit', (code) => { stopAll(); process.exit(code ?? 0); });
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { stopAll(); process.exit(0); });

if (remote) {
  const lan = Object.values(networkInterfaces()).flat().find((i) => i && i.family === 'IPv4' && !i.internal)?.address ?? '<your address>';
  console.log(`\n[slide.ng] remote access is ON. Others on your network need the password: ${password}`);
  console.log(`[slide.ng]   deck:      http://${lan}:${port}/`);
  console.log(`[slide.ng]   presenter: http://${lan}:${port}/presenter/1?password=${password}\n`);
}
