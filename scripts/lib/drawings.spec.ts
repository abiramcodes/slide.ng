import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readDrawings, svgDocument, svgInner } from './drawings.mjs';

describe('svgDocument and svgInner', () => {
  it('go back and forth', () => {
    expect(svgInner(svgDocument('<path d="M0 0"/>'))).toBe('<path d="M0 0"/>');
  });
  it('read an svg with an xml header and attributes', () => {
    expect(svgInner('<?xml version="1.0"?>\n<svg width="9" viewBox="0 0 1 1"><g/></svg>')).toBe(
      '<g/>',
    );
  });
  it('give nothing for other text', () => {
    expect(svgInner('hello')).toBe('');
    expect(svgInner('<svg></svg>')).toBe('');
  });
});

describe('svgDocument size', () => {
  it('uses the canvas size, 980x552 by default', () => {
    expect(svgDocument('')).toContain('viewBox="0 0 980 552"');
  });
  it('follows the given size', () => {
    expect(svgDocument('', { width: 640, height: 360 })).toContain('width="640" height="360"');
  });
});

describe('readDrawings', () => {
  const root = mkdtempSync(join(tmpdir(), 'slide-ng-drawings-'));
  mkdirSync(join(root, '.slide-ng/drawings'), { recursive: true });
  writeFileSync(join(root, '.slide-ng/drawings/2.svg'), svgDocument('<path d="M1 1"/>'));
  writeFileSync(join(root, '.slide-ng/drawings/notes.txt'), 'x');
  writeFileSync(join(root, '.slide-ng/drawings/x.svg'), svgDocument('<g/>'));

  it('reads numbered files when the deck persists drawings', () => {
    expect(readDrawings(root, { drawings: { persist: true } })).toEqual({ 2: '<path d="M1 1"/>' });
  });
  it('reads nothing when persist is off', () => {
    expect(readDrawings(root, {})).toEqual({});
    expect(readDrawings(root, { drawings: { persist: false } })).toEqual({});
  });
  it('reads nothing when the folder is missing', () => {
    expect(readDrawings(join(root, 'nope'), { drawings: { persist: true } })).toEqual({});
  });
});
