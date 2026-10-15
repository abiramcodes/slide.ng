// `npm start`: generate slides, then keep three things running:
//   1. the slide generator in watch mode (slides.md -> components)
//   2. UnoCSS in watch mode (class names -> CSS file)
//   3. the Angular dev server
// Extra arguments go to `ng serve`, e.g. `npm start -- --port 4300`.
import { execFileSync, spawn } from 'node:child_process';

execFileSync('node', ['scripts/generate.mjs'], { stdio: 'inherit' });
execFileSync('npx', ['unocss'], { stdio: 'inherit' });

const children = [
  spawn('node', ['scripts/generate.mjs', '--watch'], { stdio: 'inherit' }),
  spawn('npx', ['unocss', '--watch'], { stdio: 'inherit' }),
  spawn('npx', ['ng', 'serve', ...process.argv.slice(2)], { stdio: 'inherit' }),
];
const stopAll = () => children.forEach((c) => c.kill());
children[2].on('exit', (code) => { stopAll(); process.exit(code ?? 0); });
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { stopAll(); process.exit(0); });
