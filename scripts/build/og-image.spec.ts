import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ogImageAddress, ogImagePlan } from './og-image.mjs';

const folder = () => mkdtempSync(join(tmpdir(), 'slide-ng-og-'));

describe('ogImagePlan', () => {
  it('uses a given address', () =>
    expect(ogImagePlan({ seoMeta: { ogImage: 'https://x.test/a.png' } }, folder()).kind).toBe(
      'given',
    ));
  it('copies og-image.png when the deck has one, also for auto', () => {
    const dir = folder();
    writeFileSync(join(dir, 'og-image.png'), 'x');
    expect(ogImagePlan({}, dir).kind).toBe('file');
    expect(ogImagePlan({ seoMeta: { ogImage: 'auto' } }, dir).kind).toBe('file');
  });
  it('makes one for auto, and nothing otherwise', () => {
    expect(ogImagePlan({ seoMeta: { ogImage: 'auto' } }, folder()).kind).toBe('auto');
    expect(ogImagePlan({}, folder()).kind).toBe('none');
  });
});

describe('ogImageAddress', () => {
  it('starts at the base path without a site address', () =>
    expect(ogImageAddress({}, '/talk/')).toBe('/talk/og-image.png'));
  it('uses the site address when there is one', () => {
    expect(ogImageAddress({ seoMeta: { ogUrl: 'https://me.test/talk' } }, '/talk/')).toBe(
      'https://me.test/talk/og-image.png',
    );
    expect(ogImageAddress({ seoMeta: { ogUrl: 'https://me.test/talk/' } }, '/talk/')).toBe(
      'https://me.test/talk/og-image.png',
    );
  });
  it('ignores an ogUrl that is not a web address', () =>
    expect(ogImageAddress({ seoMeta: { ogUrl: 'javascript:x' } }, '/')).toBe('/og-image.png'));
});
