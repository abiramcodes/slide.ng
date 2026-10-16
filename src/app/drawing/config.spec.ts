import { readDrawingsConfig } from './config';

describe('readDrawingsConfig', () => {
  it('has Slidev defaults: on, not persisted, everyone may draw, everything syncs', () => {
    expect(readDrawingsConfig({}, true)).toEqual({
      enabled: true,
      persist: false,
      presenterOnly: false,
      syncAll: true,
    });
  });

  it('reads every key', () => {
    const c = readDrawingsConfig(
      { drawings: { enabled: false, persist: true, presenterOnly: true, syncAll: false } },
      true,
    );
    expect(c).toEqual({ enabled: false, persist: true, presenterOnly: true, syncAll: false });
  });

  it('enabled: dev is on only while developing, build only in the built deck', () => {
    expect(readDrawingsConfig({ drawings: { enabled: 'dev' } }, true).enabled).toBe(true);
    expect(readDrawingsConfig({ drawings: { enabled: 'dev' } }, false).enabled).toBe(false);
    expect(readDrawingsConfig({ drawings: { enabled: 'build' } }, true).enabled).toBe(false);
    expect(readDrawingsConfig({ drawings: { enabled: 'build' } }, false).enabled).toBe(true);
  });
});
