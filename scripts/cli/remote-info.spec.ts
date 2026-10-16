import { remoteLines } from './remote-info.mjs';

describe('remoteLines', () => {
  it('with a password: a private address with the password, no warning', () => {
    const text = remoteLines({ port: 4230, password: 'sec ret', addresses: ['192.168.1.5'] }).join('\n');
    expect(text).toContain('public slide show:  http://192.168.1.5:4230/');
    expect(text).toContain('private slide show: http://192.168.1.5:4230/?password=sec%20ret');
    expect(text).toContain('presenter/1?password=sec%20ret');
    expect(text).not.toContain('WARNING');
  });
  it('without a password: warns and shows no password in any address', () => {
    const text = remoteLines({ port: 4230, password: '', addresses: ['10.0.0.2'] }).join('\n');
    expect(text).toContain('WARNING: no password');
    expect(text).not.toContain('password=');
    expect(text).not.toContain('private slide show');
  });
  it('says so when there is no network address', () => {
    expect(remoteLines({ port: 1, password: '', addresses: [] }).join('\n')).toContain('<your address>');
  });
});
