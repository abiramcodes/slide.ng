import { fixWebmDuration, setWebmDuration } from './webm-duration';

// A webm as MediaRecorder starts one: EBML header, a Segment of unknown size, Info (timecode scale, apps), a Cluster.
const bytes = (...parts: (number | number[])[]) => Uint8Array.from(parts.flat());
const ebmlHeader = [0x1a, 0x45, 0xdf, 0xa3, 0x84, 0x42, 0x82, 0x81, 0x00]; // header with one small child
const timecodeScale = [0x2a, 0xd7, 0xb1, 0x83, 0x0f, 0x42, 0x40]; // 1 000 000
const muxingApp = [0x4d, 0x80, 0x82, 0x41, 0x42];
const infoWith = (content: number[]) => [0x15, 0x49, 0xa9, 0x66, 0x80 | content.length, ...content];
const cluster = [0x1f, 0x43, 0xb6, 0x75, 0x82, 0xe7, 0x80];
const unknownSegment = [0x18, 0x53, 0x80, 0x67, 0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff];

/** Finds the Duration in the result and gives its value. */
function durationOf(file: Uint8Array): number | null {
  for (let i = 0; i < file.length - 10; i++) {
    if (file[i] === 0x44 && file[i + 1] === 0x89 && file[i + 2] === 0x88)
      return new DataView(file.buffer, file.byteOffset + i + 3, 8).getFloat64(0);
  }
  return null;
}

describe('setWebmDuration', () => {
  const plain = bytes(
    ebmlHeader,
    unknownSegment,
    infoWith([...timecodeScale, ...muxingApp]),
    cluster,
  );

  it('adds a Duration in milliseconds (the default timecode scale)', () => {
    const fixed = setWebmDuration(plain, 12_500)!;
    expect(durationOf(fixed)).toBe(12_500);
    expect(durationOf(plain)).toBeNull();
  });
  it('keeps everything else: the header, the other Info fields and the clusters', () => {
    const fixed = setWebmDuration(plain, 1000)!;
    expect(Array.from(fixed.slice(0, ebmlHeader.length))).toEqual(ebmlHeader);
    expect(Array.from(fixed.slice(-cluster.length))).toEqual(cluster);
    expect(fixed.length).toBeGreaterThan(plain.length);
    const text = Array.from(fixed).join(',');
    expect(text).toContain(timecodeScale.join(','));
    expect(text).toContain(muxingApp.join(','));
  });
  it('replaces a Duration that is already there', () => {
    const once = setWebmDuration(plain, 1000)!;
    const twice = setWebmDuration(once, 3000)!;
    expect(durationOf(twice)).toBe(3000);
    expect(twice.length).toBe(once.length);
  });
  it('reads the unit from the timecode scale', () => {
    const micro = bytes(
      ebmlHeader,
      unknownSegment,
      infoWith([0x2a, 0xd7, 0xb1, 0x82, 0x03, 0xe8, ...muxingApp]),
      cluster,
    ); // 1000 ns per tick
    expect(durationOf(setWebmDuration(micro, 2)!)).toBe(2000);
  });
  it('grows a Segment that has a known size', () => {
    const info = infoWith([...timecodeScale]);
    const inner = [...info, ...cluster];
    const known = bytes(ebmlHeader, [0x18, 0x53, 0x80, 0x67, 0x80 | inner.length], inner);
    const fixed = setWebmDuration(known, 500)!;
    const sizeAt = ebmlHeader.length + 4;
    expect(fixed[sizeAt] & 0x7f).toBe(fixed.length - ebmlHeader.length - 5);
    expect(durationOf(fixed)).toBe(500);
  });
  it('gives null for anything that is not a webm, or a length that makes no sense', () => {
    expect(setWebmDuration(bytes(1, 2, 3), 1000)).toBeNull();
    expect(setWebmDuration(bytes(ebmlHeader, cluster), 1000)).toBeNull();
    expect(setWebmDuration(plain, 0)).toBeNull();
    expect(setWebmDuration(plain, NaN)).toBeNull();
  });
});

describe('fixWebmDuration', () => {
  it('leaves a blob that is not a webm alone', async () => {
    const blob = new Blob(['x'], { type: 'video/mp4' });
    expect(await fixWebmDuration(blob, 1000)).toBe(blob);
  });
  it('leaves a webm it cannot read alone', async () => {
    const blob = new Blob(['not a webm'], { type: 'video/webm' });
    expect(await fixWebmDuration(blob, 1000)).toBe(blob);
  });
  it('gives a webm blob with the duration', async () => {
    const file = bytes(ebmlHeader, unknownSegment, infoWith(timecodeScale), cluster);
    const fixed = await fixWebmDuration(new Blob([file], { type: 'video/webm;codecs=vp9' }), 4000);
    expect(fixed.type).toBe('video/webm;codecs=vp9');
    expect(durationOf(new Uint8Array(await fixed.arrayBuffer()))).toBe(4000);
  });
});
