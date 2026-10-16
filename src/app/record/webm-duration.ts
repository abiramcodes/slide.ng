// A webm made by MediaRecorder has no duration, so some players show it only after a seek. Slidev fixes this when a recording is
// saved (it uses the `@fix-webm-duration` package); this is the same job in a small function: put a Duration element into the
// file's Info block. Anything unexpected returns null and the file is saved as it came.

const ID_SEGMENT = 0x18538067;
const ID_INFO = 0x1549a966;
const ID_TIMECODE_SCALE = 0x2ad7b1;
const ID_DURATION = 0x4489;

interface Vint { value: number; length: number; unknown: boolean }

/** An EBML variable-length number (the length of a size field), or an element id when `keepMarker`. */
function readVint(bytes: Uint8Array, at: number, keepMarker = false): Vint | null {
  const first = bytes[at];
  if (first === undefined || first === 0) return null;
  const length = Math.clz32(first) - 23; // leading zero bits of the byte, plus one
  if (length > 8 || at + length > bytes.length) return null;
  let value = keepMarker ? first : first & (0xff >> length);
  let allOnes = (first & (0xff >> length)) === (0xff >> length);
  for (let i = 1; i < length; i++) {
    value = value * 256 + bytes[at + i];
    if (bytes[at + i] !== 0xff) allOnes = false;
  }
  return { value, length, unknown: !keepMarker && allOnes };
}

function writeSize(value: number, length: number): Uint8Array {
  const out = new Uint8Array(length);
  let rest = value;
  for (let i = length - 1; i >= 0; i--) { out[i] = rest % 256; rest = Math.floor(rest / 256); }
  out[0] |= 0x80 >> (length - 1);
  return out;
}

const idBytes = (id: number) => Uint8Array.from(id.toString(16).padStart(id > 0xffffff ? 8 : id > 0xffff ? 6 : id > 0xff ? 4 : 2, '0').match(/../g)!.map((h) => parseInt(h, 16)));
const join = (...parts: Uint8Array[]) => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let at = 0; for (const p of parts) { out.set(p, at); at += p.length; } return out; };

function float64(value: number): Uint8Array {
  const out = new Uint8Array(8);
  new DataView(out.buffer).setFloat64(0, value);
  return out;
}

interface Element { id: number; start: number; dataStart: number; end: number; sizeLength: number; unknown: boolean }

/** The element that starts at `at` (its end is the end of the buffer when its size is unknown). */
function readElement(bytes: Uint8Array, at: number): Element | null {
  const id = readVint(bytes, at, true);
  const size = id && readVint(bytes, at + id.length);
  if (!id || !size) return null;
  const dataStart = at + id.length + size.length;
  const end = size.unknown ? bytes.length : dataStart + size.value;
  return end > bytes.length ? null : { id: id.value, start: at, dataStart, end, sizeLength: size.length, unknown: size.unknown };
}

/** The elements directly inside `[from, to)`, stopping at the first one that is not readable or has an unknown size. */
function children(bytes: Uint8Array, from: number, to: number): Element[] {
  const out: Element[] = [];
  for (let at = from; at < to;) {
    const el = readElement(bytes, at);
    if (!el || el.end > to) break;
    out.push(el);
    if (el.unknown) break;
    at = el.end;
  }
  return out;
}

/** The file with a Duration (in milliseconds) written into its Info block, or null when its layout is not the one MediaRecorder makes. */
export function setWebmDuration(bytes: Uint8Array, durationMs: number): Uint8Array | null {
  if (!(durationMs > 0) || !Number.isFinite(durationMs)) return null;
  const segment = children(bytes, 0, bytes.length).find((e) => e.id === ID_SEGMENT);
  if (!segment) return null;
  const info = children(bytes, segment.dataStart, segment.end).find((e) => e.id === ID_INFO);
  if (!info || info.unknown) return null;

  const inner = children(bytes, info.dataStart, info.end);
  const scaleEl = inner.find((e) => e.id === ID_TIMECODE_SCALE);
  let scale = 1_000_000; // nanoseconds per tick, the default
  if (scaleEl) scale = bytes.slice(scaleEl.dataStart, scaleEl.end).reduce((n, b) => n * 256 + b, 0) || scale;
  const ticks = (durationMs * 1_000_000) / scale;

  const old = inner.find((e) => e.id === ID_DURATION);
  const data = bytes.slice(info.dataStart, info.end);
  const without = old ? join(data.slice(0, old.start - info.dataStart), data.slice(old.end - info.dataStart)) : data;
  const duration = join(idBytes(ID_DURATION), writeSize(8, 1), float64(ticks));
  const content = join(without, duration);

  const newInfo = join(idBytes(ID_INFO), writeSize(content.length, 8), content);
  const delta = newInfo.length - (info.end - info.start);
  const head = bytes.slice(0, info.start);
  // A Segment with a known size has to grow by the same amount.
  if (!segment.unknown) {
    const grown = segment.end - segment.dataStart + delta;
    head.set(writeSize(grown, segment.sizeLength), segment.dataStart - segment.sizeLength);
  }
  return join(head, newInfo, bytes.slice(info.end));
}

/** The blob with its duration set, or the same blob when that is not possible. */
export async function fixWebmDuration(blob: Blob, durationMs: number): Promise<Blob> {
  if (!/webm/.test(blob.type)) return blob;
  try {
    const fixed = setWebmDuration(new Uint8Array(await blob.arrayBuffer()), durationMs);
    return fixed ? new Blob([fixed as BlobPart], { type: blob.type }) : blob;
  } catch { return blob; }
}
