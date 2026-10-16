import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { offerInstall, installCommand } from './install-root.mjs';

const folder = () => mkdtempSync(join(tmpdir(), 'slide-ng-install-'));
const error = { kind: 'theme', spec: 'seriph', pkg: 'slide-ng-theme-seriph' };

describe('installCommand', () => {
  it('is npm without a lock file', () => {
    expect(installCommand(folder(), 'slide-ng-theme-x').command).toBe('npm install -D slide-ng-theme-x');
  });
  it('follows the lock file', () => {
    const deck = folder();
    writeFileSync(join(deck, 'yarn.lock'), '');
    expect(installCommand(deck, 'p').command).toBe('yarn add -D p');
  });
});

describe('offerInstall', () => {
  it('does nothing without a terminal', async () => {
    const run = vi.fn(() => true);
    expect(await offerInstall(error, folder(), { isTTY: false, ask: async () => true, run })).toBe(false);
    expect(run).not.toHaveBeenCalled();
  });
  it('installs when the answer is yes', async () => {
    const run = vi.fn(() => true);
    expect(await offerInstall(error, folder(), { isTTY: true, ask: async () => true, run })).toBe(true);
    expect(run).toHaveBeenCalledWith('npm', ['install', '-D', 'slide-ng-theme-seriph']);
  });
  it('does not install when the answer is no', async () => {
    const run = vi.fn(() => true);
    expect(await offerInstall(error, folder(), { isTTY: true, ask: async () => false, run })).toBe(false);
    expect(run).not.toHaveBeenCalled();
  });
});
