// `npm start`: generate slides, then keep two things running:
//   1. the generator in watch mode (slides.md -> components, class names -> CSS file)
//   2. the Angular dev server
// Extra arguments go to `ng serve`, e.g. `npm start -- --port 4300`.
import { execFileSync, spawn } from 'node:child_process';

execFileSync('node', ['scripts/generate.mjs'], { stdio: 'inherit' });

const children = [
  spawn('node', ['scripts/generate.mjs', '--watch'], { stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/@angular/cli/bin/ng.js', 'serve', ...process.argv.slice(2)], { stdio: 'inherit' }),
];
const stopAll = () => children.forEach((c) => c.kill());
children[1].on('exit', (code) => { stopAll(); process.exit(code ?? 0); });
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { stopAll(); process.exit(0); });
