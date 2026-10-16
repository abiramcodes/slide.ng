import { isLocalPage } from './nav-sync';

describe('isLocalPage', () => {
  it('knows the local host names', () => {
    for (const hostname of ['localhost', '127.0.0.1', '[::1]']) expect(isLocalPage({ protocol: 'http:', hostname })).toBe(true);
  });

  it('counts a folder opened from disk as local', () => {
    expect(isLocalPage({ protocol: 'file:', hostname: '' })).toBe(true);
  });

  it('does not trust another machine or an empty host name on the web', () => {
    expect(isLocalPage({ protocol: 'https:', hostname: 'talk.example.com' })).toBe(false);
    expect(isLocalPage({ protocol: 'http:', hostname: '192.168.1.5' })).toBe(false);
    expect(isLocalPage({ protocol: 'http:', hostname: '' })).toBe(false);
  });
});
