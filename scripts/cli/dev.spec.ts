import { describe, expect, it } from 'vitest';
import { devPlan } from './dev.mjs';

describe('devPlan', () => {
  it('has sensible defaults', () => {
    const plan = devPlan([]);
    expect(plan).toMatchObject({ port: 4230, open: false, remote: false, password: '', log: 'info', force: false });
    expect(plan.entry.endsWith('slides.md')).toBe(true);
    expect(plan.host).toBeUndefined();
  });
  it('reads --theme and its alias', () => {
    expect(devPlan(['--theme', './t']).theme).toBe('./t');
    expect(devPlan(['-t', 'x']).theme).toBe('x');
  });
  it('reads the entry file and the flags', () => {
    const plan = devPlan(['talk/my.md', '--port', '4300', '--open', '--log=warn', '--force']);
    expect(plan).toMatchObject({ port: 4300, open: true, log: 'warn', force: true });
    expect(plan.entry.endsWith('talk/my.md')).toBe(true);
  });
  it('--remote listens on every address; the password is optional, as in Slidev', () => {
    const named = devPlan(['--remote=secret']);
    expect(named).toMatchObject({ remote: true, password: 'secret', host: '0.0.0.0' });
    expect(devPlan(['--remote'])).toMatchObject({ remote: true, password: '', host: '0.0.0.0' });
    expect(devPlan(['--remote='])).toMatchObject({ remote: true, password: '' });
  });
  it('--remote does not swallow the next argument', () => {
    expect(devPlan(['--remote', 'other.md']).entry.endsWith('other.md')).toBe(true);
  });
  it('--bind sets the address in remote mode only, as in Slidev', () => {
    expect(devPlan(['--bind', '127.0.0.1']).host).toBeUndefined();
    expect(devPlan(['--remote=x', '--bind', '192.168.1.5']).host).toBe('192.168.1.5');
  });
  it('refuses --tunnel, --base and a wrong --log', () => {
    expect(() => devPlan(['--tunnel'])).toThrow('--tunnel is not available');
    expect(() => devPlan(['--base', '/x/'])).toThrow('slide-ng build');
    expect(() => devPlan(['--log', 'loud'])).toThrow('--log must be one of');
  });
});
