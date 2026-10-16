import http from 'node:http';
import { describe, expect, it } from 'vitest';
import { sendFile } from './static-server.mjs';

describe('sendFile', () => {
  it('answers 500 instead of crashing when the file is gone', async () => {
    const server = http.createServer((_req, res) => sendFile('/no/such/file.txt', res));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const { port } = server.address() as { port: number };
    const res = await fetch(`http://127.0.0.1:${port}/`);
    expect(res.status).toBe(500);
    server.close();
  });
});
