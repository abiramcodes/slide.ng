import { readRecordConfig } from './config';

describe('readRecordConfig', () => {
  it('is on in development and off in the build by default (Slidev: record: dev)', () => {
    expect(readRecordConfig({}, true)).toBe(true);
    expect(readRecordConfig({}, false)).toBe(false);
  });
  it('takes true and false as they are', () => {
    expect(readRecordConfig({ record: true }, false)).toBe(true);
    expect(readRecordConfig({ record: false }, true)).toBe(false);
  });
  it('lets `build` mean only the built deck and `dev` only development', () => {
    expect(readRecordConfig({ record: 'build' }, false)).toBe(true);
    expect(readRecordConfig({ record: 'build' }, true)).toBe(false);
    expect(readRecordConfig({ record: 'dev' }, true)).toBe(true);
  });
});
