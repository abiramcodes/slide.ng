import {
  mkdirSync,
  mkdtempSync,
  symlinkSync,
  writeFileSync,
  existsSync,
  readFileSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MARKER,
  checkClaimable,
  claimDirectory,
  markDirectory,
  publishDirectory,
} from './safe-dir.mjs';

const tmp = () => mkdtempSync(join(tmpdir(), 'slide-ng-safe-'));

describe('checkClaimable', () => {
  it('allows a new folder and an empty one', () => {
    const base = tmp();
    expect(() => checkClaimable(join(base, 'new'), base)).not.toThrow();
    mkdirSync(join(base, 'empty'));
    expect(() => checkClaimable(join(base, 'empty'), base)).not.toThrow();
  });
  it('refuses a folder with files and no marker', () => {
    const base = tmp();
    mkdirSync(join(base, 'mine'));
    writeFileSync(join(base, 'mine', 'precious.txt'), 'x');
    expect(() => checkClaimable(join(base, 'mine'), base)).toThrow('not made by slide.ng');
  });
  it('allows a folder with the marker', () => {
    const base = tmp();
    mkdirSync(join(base, 'dist'));
    writeFileSync(join(base, 'dist', 'a.js'), 'x');
    markDirectory(join(base, 'dist'));
    expect(() => checkClaimable(join(base, 'dist'), base)).not.toThrow();
  });
  it('refuses the root, the home folder, the current folder and its parents', () => {
    const base = tmp();
    expect(() => checkClaimable('/', base)).toThrow('root');
    expect(() => checkClaimable(homedir(), base)).toThrow('home');
    expect(() => checkClaimable(base, base)).toThrow('current folder');
    expect(() => checkClaimable(tmpdir(), base)).toThrow('current folder');
  });
  it('refuses the current folder given through a symbolic link', () => {
    const base = tmp();
    const other = tmp();
    symlinkSync(base, join(other, 'via'));
    expect(() => checkClaimable(join(other, 'via'), base)).toThrow('current folder');
  });
  it('refuses a symbolic link and a file', () => {
    const base = tmp();
    mkdirSync(join(base, 'real'));
    symlinkSync(join(base, 'real'), join(base, 'link'));
    writeFileSync(join(base, 'file'), 'x');
    expect(() => checkClaimable(join(base, 'link'), base)).toThrow('symbolic link');
    expect(() => checkClaimable(join(base, 'file'), base)).toThrow('a file');
  });
});

describe('claimDirectory and publishDirectory', () => {
  it('empties a marked folder and copies into it', () => {
    const base = tmp();
    mkdirSync(join(base, 'src'));
    writeFileSync(join(base, 'src', 'index.html'), 'new');
    mkdirSync(join(base, 'out'));
    writeFileSync(join(base, 'out', 'old.js'), 'old');
    markDirectory(join(base, 'out'));
    publishDirectory(join(base, 'src'), join(base, 'out'), base);
    expect(existsSync(join(base, 'out', 'old.js'))).toBe(false);
    expect(readFileSync(join(base, 'out', 'index.html'), 'utf8')).toBe('new');
    expect(existsSync(join(base, 'out', MARKER))).toBe(true);
  });
  it('never touches an unmarked folder', () => {
    const base = tmp();
    mkdirSync(join(base, 'out'));
    writeFileSync(join(base, 'out', 'keep.txt'), 'keep');
    expect(() => claimDirectory(join(base, 'out'), base)).toThrow();
    expect(existsSync(join(base, 'out', 'keep.txt'))).toBe(true);
  });
});
