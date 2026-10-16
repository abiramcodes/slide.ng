import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findLayers, layersSource } from './layers.mjs';

describe('findLayers', () => {
  it('finds only the files that exist, in a fixed order', () => {
    const dir = mkdtempSync(join(tmpdir(), 'slide-ng-layers-'));
    mkdirSync(dir, { recursive: true });
    for (const n of ['slide-top', 'global-bottom', 'other']) writeFileSync(join(dir, `${n}.ts`), '');
    expect(findLayers(dir)).toEqual(['global-bottom', 'slide-top']);
  });
  it('finds nothing in a missing folder', () => {
    expect(findLayers('/no/such/folder')).toEqual([]);
  });
});

describe('layersSource', () => {
  it('imports the found layers and makes the others null', () => {
    const src = layersSource(['global-top']);
    expect(src).toContain("import globalTop from '../../app/layers/global-top';");
    expect(src).toContain("'global-top': globalTop,");
    expect(src).toContain("'slide-bottom': null,");
  });
  it('is valid with no layers at all', () => {
    expect(layersSource([])).not.toContain('import globalTop');
  });
});
