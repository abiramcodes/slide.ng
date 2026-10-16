import { clock, pickMimeType, recordingName } from './recording-file';

describe('pickMimeType', () => {
  it('prefers vp9, then vp8, then plain webm', () => {
    expect(pickMimeType(() => true)).toBe('video/webm;codecs=vp9,opus');
    expect(pickMimeType((t) => !t.includes('vp9'))).toBe('video/webm;codecs=vp8,opus');
    expect(pickMimeType((t) => t === 'video/webm')).toBe('video/webm');
  });
  it('gives an empty text when nothing is supported', () => {
    expect(pickMimeType(() => false)).toBe('');
  });
});

describe('recordingName', () => {
  const when = new Date(2025, 2, 9, 14, 5, 7);
  it('makes a safe file name from the title and the time', () => {
    expect(recordingName('My Talk: Part 1!', when)).toBe('my-talk-part-1-2025-03-09-14-05-07.webm');
  });
  it('falls back to a plain name', () => {
    expect(recordingName('???', when)).toBe('slides-2025-03-09-14-05-07.webm');
  });
});

describe('clock', () => {
  it('writes minutes and seconds', () => {
    expect([clock(0), clock(75.9), clock(3600), clock(-3)]).toEqual(['00:00', '01:15', '60:00', '00:00']);
  });
});
