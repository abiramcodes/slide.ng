import { diskScope } from './disk-scope';

describe('diskScope', () => {
  it('is empty for a web address', () => {
    expect(diskScope({ protocol: 'https:', pathname: '/talk/3' })).toBe('');
    expect(diskScope({ protocol: 'http:', pathname: '/' })).toBe('');
  });

  it('is the folder of the page for a file', () => {
    expect(diskScope({ protocol: 'file:', pathname: '/home/me/talks/a/index.html' })).toBe(
      '@/home/me/talks/a/',
    );
  });

  it('differs between two folders and stays the same for one', () => {
    const a = diskScope({ protocol: 'file:', pathname: '/talks/a/index.html' });
    expect(a).not.toBe(diskScope({ protocol: 'file:', pathname: '/talks/b/index.html' }));
    expect(a).toBe(diskScope({ protocol: 'file:', pathname: '/talks/a/other.html' }));
  });
});
