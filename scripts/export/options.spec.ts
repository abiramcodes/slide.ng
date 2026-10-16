import { describe, expect, it } from 'vitest';
import { resolveExportOptions } from './options.mjs';

describe('resolveExportOptions', () => {
  it('has Slidev defaults', () => {
    const o = resolveExportOptions({}, {});
    expect(o).toMatchObject({ format: 'pdf', withClicks: false, dark: false, timeout: 30000, wait: 0, waitUntil: 'networkidle', scale: 2, perSlide: false, withToc: false });
  });
  it('puts the command line over the headmatter over the defaults', () => {
    const head = { export: { format: 'png', scale: 3, withToc: true } };
    expect(resolveExportOptions({ scale: 1 }, head)).toMatchObject({ format: 'png', scale: 1, withToc: true });
  });
  it('turns pptx into one slide per click, unless said otherwise', () => {
    expect(resolveExportOptions({ format: 'pptx' }, {}).withClicks).toBe(true);
    expect(resolveExportOptions({ format: 'pptx', 'with-clicks': false }, {}).withClicks).toBe(false);
  });
  it('is dark for --dark and for colorSchema: dark', () => {
    expect(resolveExportOptions({ dark: true }, {}).dark).toBe(true);
    expect(resolveExportOptions({}, { colorSchema: 'dark' }).dark).toBe(true);
  });
  it('reads kebab-case flags', () => {
    const o = resolveExportOptions({ 'wait-until': 'load', 'omit-background': true, 'per-slide': true, 'executable-path': '/x/chrome' }, {});
    expect(o).toMatchObject({ waitUntil: 'load', omitBackground: true, perSlide: true, executablePath: '/x/chrome' });
    expect(resolveExportOptions({ 'wait-until': 'none' }, {}).waitUntil).toBeUndefined();
  });
  it('never takes the program or the output path from the headmatter', () => {
    const o = resolveExportOptions({}, { export: { executablePath: '/bin/sh', output: '/etc/x' } });
    expect(o.executablePath).toBe(process.env['CHROME_PATH']);
    expect(o.output).toBeUndefined();
  });
  it('refuses bad values', () => {
    expect(() => resolveExportOptions({ format: 'gif' }, {})).toThrow('format');
    expect(() => resolveExportOptions({ timeout: 5 }, {})).toThrow('timeout');
    expect(() => resolveExportOptions({ scale: 99 }, {})).toThrow('scale');
    expect(() => resolveExportOptions({ 'wait-until': 'soon' }, {})).toThrow('wait-until');
  });
});
