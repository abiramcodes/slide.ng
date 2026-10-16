// Small pure helpers for the recorder, kept apart so they can be tested without a browser camera.

const MIME_TYPES = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];

/** The first format the browser can record, or '' to let it choose. */
export function pickMimeType(isSupported: (type: string) => boolean): string {
  return MIME_TYPES.find(isSupported) ?? '';
}

/** `my-talk-2025-03-09-14-30-05.webm`: the deck title, made safe for a file name, and the time. */
export function recordingName(title: string, now: Date): string {
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'slides';
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return `${slug}-${stamp}.webm`;
}

/** 75 seconds -> `01:15` */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
