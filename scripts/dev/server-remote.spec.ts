// @vitest-environment node
// `--remote` without a password (what Slidev does by default): the same Host, Origin, token and path rules still hold.
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readConfig } from './config.mjs';
import { startServer } from './server.mjs';

const SLIDES = '---\ntitle: T\n---\n\n# One\n\n<img v-drag="[1,2,3,4]">\n\n---\n\n# Two\n';
let root: string, port: number, stop: () => void;

function ask(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<{ status: number; json: any }> {
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, method, path, headers: { 'content-type': 'application/json', ...headers } }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode!, json: data ? JSON.parse(data) : null }));
    });
    req.on('error', reject);
    req.end(body === undefined ? undefined : JSON.stringify(body));
  });
}

beforeAll(async () => {
  root = mkdtempSync(join(tmpdir(), 'slide-ng-remote-'));
  writeFileSync(join(root, 'slides.md'), SLIDES);
  const started = await startServer({ ...readConfig({ SLIDE_NG_TOKEN: 'tok3', SLIDE_NG_REMOTE: '1' }, root), port: 0 });
  port = started.port;
  stop = () => { started.server.close(); started.hub.close(); };
});
afterAll(() => stop());

describe('--remote without a password', () => {
  it('hands out the token without a login, also to a network address', async () => {
    const r = await ask('GET', '/__slide-ng/session', undefined, { host: '192.168.1.20:4230', origin: 'http://192.168.1.20:4230' });
    expect(r.status).toBe(200);
    expect(r.json.token).toBe('tok3');
  });
  it('still refuses a write without the token, a foreign Origin and a foreign Host', async () => {
    const drag = { site: 0, pos: '9,9,9,9' };
    expect((await ask('POST', '/__slide-ng/slides/1/drag', drag, { 'x-slide-ng-token': 'nope' })).status).toBe(403);
    expect((await ask('POST', '/__slide-ng/slides/1/drag', drag, { 'x-slide-ng-token': 'tok3', origin: 'http://evil.example' })).status).toBe(403);
    expect((await ask('GET', '/__slide-ng/session', undefined, { host: 'evil.example' })).status).toBe(403);
    expect(readFileSync(join(root, 'slides.md'), 'utf8')).toBe(SLIDES);
  });
  it('a write with the token is accepted, a request cannot name a file', async () => {
    expect((await ask('POST', '/__slide-ng/slides/1/drag', { site: 0, pos: '5,6,7,8' }, { 'x-slide-ng-token': 'tok3' })).status).toBe(200);
    expect((await ask('PUT', '/__slide-ng/monaco/..%2Fx', { content: 'x' }, { 'x-slide-ng-token': 'tok3' })).status).toBe(404);
  });
});
