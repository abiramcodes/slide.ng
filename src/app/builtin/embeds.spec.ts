import { biggestFit } from './auto-fit-text';
import { resolvePostUri } from './blue-sky';
import { resolveTweetId } from './tweet-id';

describe('biggestFit', () => {
  it('finds the biggest size that still fits', () => {
    expect(biggestFit(10, 100, (s) => s <= 42)).toBeGreaterThan(41.4);
    expect(biggestFit(10, 100, (s) => s <= 42)).toBeLessThanOrEqual(42);
  });
  it('gives the maximum when everything fits and the minimum when nothing does', () => {
    expect(biggestFit(10, 100, () => true)).toBe(100);
    expect(biggestFit(10, 100, () => false)).toBe(10);
  });
});

describe('resolveTweetId', () => {
  it('prefers the id, else reads it from an address on x.com or twitter.com', () => {
    expect(resolveTweetId(20)).toBe('20');
    expect(resolveTweetId(undefined, 'https://x.com/jack/status/20')).toBe('20');
    expect(
      resolveTweetId(undefined, 'https://twitter.com/jack/status/1392246507793915904?s=20'),
    ).toBe('1392246507793915904');
  });
  it('is undefined when there is neither', () => {
    expect(resolveTweetId()).toBeUndefined();
    expect(resolveTweetId(undefined, 'https://example.com/a')).toBeUndefined();
  });
});

describe('resolvePostUri', () => {
  it('keeps an at:// address as it is, without any request', async () => {
    expect(await resolvePostUri('at://did:plc:abc/app.bsky.feed.post/xyz')).toBe(
      'at://did:plc:abc/app.bsky.feed.post/xyz',
    );
  });
  it('gives up on an address that is not a post', async () => {
    expect(await resolvePostUri('https://example.com/')).toBeUndefined();
    expect(await resolvePostUri('not a url')).toBeUndefined();
  });
});
