// The settings of one dev session. `scripts/dev.mjs` puts them into the environment of the companion
// server; nothing here comes from a web request.
import { randomBytes } from 'node:crypto';
import { dirname, resolve } from 'node:path';

export const randomSecret = () => randomBytes(24).toString('hex');

export function readConfig(env, cwd = process.cwd()) {
  const entry = resolve(cwd, env.SLIDES_FILE ?? 'slides.md');
  return {
    /** The folder of the deck: nothing outside it is ever written. `.slide-ng/` lives here too. */
    root: dirname(entry),
    entry,
    /** Sent with every write and WebSocket; a page learns it from /session. */
    token: env.SLIDE_NG_TOKEN || randomSecret(),
    /** `--remote` password; empty means no password (only possible without --remote). */
    password: env.SLIDE_NG_PASSWORD ?? '',
    /** What the cookie holds once the password was right. Different from the password, new every start. */
    auth: randomSecret(),
    remote: env.SLIDE_NG_REMOTE === '1',
    /** Host names the machine is reached by (besides localhost and addresses). */
    hostnames: (env.SLIDE_NG_HOSTNAMES ?? '').split(',').filter(Boolean),
    port: Number(env.SLIDE_NG_DEV_PORT) || 0,
  };
}
