// @vitest-environment node
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { isPublicAddress, safeFetch } from './safe-fetch.mjs';

describe('isPublicAddress', () => {
  it('accepts public addresses', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '93.184.216.34', '2606:4700:4700::1111'])
      expect(isPublicAddress(ip), ip).toBe(true);
  });
  it('refuses loopback, link-local, metadata, private, shared and reserved addresses', () => {
    for (const ip of [
      '127.0.0.1',
      '127.8.8.8',
      '0.0.0.0',
      '10.1.2.3',
      '172.16.0.1',
      '172.31.255.255',
      '192.168.1.1',
      '169.254.169.254',
      '100.64.0.1',
      '224.0.0.1',
      '255.255.255.255',
      '::1',
      '::',
      'fe80::1',
      'fc00::1',
      'fd12:3456::1',
      '::ffff:127.0.0.1',
      '::ffff:7f00:1',
      '::ffff:a9fe:a9fe',
      '64:ff9b::7f00:1',
      '2002:7f00:1::',
      'not an address',
    ])
      expect(isPublicAddress(ip), ip).toBe(false);
  });
});

describe('safeFetch', () => {
  let server: Server, port: number, base: string;
  const big = Buffer.alloc(300_000, 1);
  beforeAll(async () => {
    server = createServer((req, res) => {
      const url = req.url ?? '';
      if (url === '/ok')
        return void res.writeHead(200, { 'content-type': 'text/plain' }).end('hello');
      if (url === '/r1') return void res.writeHead(302, { location: '/ok' }).end();
      if (url === '/chain/0') return void res.writeHead(302, { location: '/ok' }).end();
      if (/^\/chain\/\d+$/.test(url))
        return void res.writeHead(302, { location: `/chain/${Number(url.slice(7)) - 1}` }).end();
      if (url === '/to-metadata')
        return void res.writeHead(302, { location: 'http://169.254.169.254/latest/' }).end();
      if (url === '/big')
        return void res.writeHead(200, { 'content-length': String(big.length) }).end(big);
      if (url === '/chunked') {
        res.writeHead(200); // no Content-Length: the stream has to be cut
        for (let i = 0; i < 20; i++) res.write(big);
        return void res.end();
      }
      res.writeHead(404).end();
    });
    await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
    port = (server.address() as AddressInfo).port;
    base = `http://127.0.0.1:${port}`;
  });
  afterAll(() => server.close());
  const local = { allowLocal: true, maxBytes: 100_000 };

  it('refuses loopback, a name that resolves to loopback, metadata and private addresses', async () => {
    const options = { allowLocal: false, maxBytes: 1000 };
    await expect(safeFetch(`${base}/ok`, options)).rejects.toThrow('not a public address');
    await expect(safeFetch(`http://localhost:${port}/ok`, options)).rejects.toThrow(
      'not a public address',
    );
    for (const url of [
      'http://169.254.169.254/latest/meta-data/',
      'http://10.0.0.5/x',
      'http://192.168.0.1/x',
      'http://[::1]/x',
      'http://[::ffff:127.0.0.1]/x',
      'http://2130706433/x', // 127.0.0.1 written as one number
      'http://0x7f.1/x',
    ])
      await expect(safeFetch(url, options), url).rejects.toThrow('not a public address');
  });
  it('refuses other protocols', async () => {
    await expect(safeFetch('file:///etc/passwd', local)).rejects.toThrow('not downloaded');
    await expect(safeFetch('ftp://x.test/a', local)).rejects.toThrow('not downloaded');
  });
  it('reads a small answer and follows a redirect', async () => {
    const r = await safeFetch(`${base}/r1`, local);
    expect(r.bytes.toString()).toBe('hello');
    expect(r.url).toBe(`${base}/ok`);
  });
  it('follows at most 3 redirects', async () => {
    expect((await safeFetch(`${base}/chain/2`, local)).ok).toBe(true);
    await expect(safeFetch(`${base}/chain/3`, local)).rejects.toThrow('more than 3 redirects');
  });
  it('checks the address of every redirect', async () => {
    await expect(safeFetch(`${base}/to-metadata`, { ...local, allowLocal: false })).rejects.toThrow(
      'not a public address',
    );
  });
  it('a redirect from an allowed address to a refused one is refused', async () => {
    // The first hop is a fake public server; its redirect points at the metadata address.
    const calls: string[] = [];
    const fetchImpl = async (url: string) => {
      calls.push(url);
      return url.startsWith('https://public.test')
        ? new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/' } })
        : new Response('secret');
    };
    await expect(
      safeFetch('https://public.test/a', { maxBytes: 100, fetchImpl: fetchImpl as never }),
    ).rejects.toThrow('not a public address');
    expect(calls).toEqual(['https://public.test/a']);
  });
  it('honours Content-Length and stops a stream that has none', async () => {
    await expect(safeFetch(`${base}/big`, local)).rejects.toThrow('Content-Length says 300000');
    await expect(safeFetch(`${base}/chunked`, local)).rejects.toThrow('larger than');
  });
  it('reports an error status without a body', async () => {
    const r = await safeFetch(`${base}/missing`, local);
    expect(r.ok).toBe(false);
    expect(r.status).toBe(404);
  });
});
