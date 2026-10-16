// PlantUML servers take the diagram text deflated and written in their own base64 alphabet.
// (This is what the `plantuml-encoder` package does; it is short enough to write here.)
import { deflateRawSync } from 'node:zlib';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

// Three bytes become four characters of 6 bits each.
function threeBytes(b1, b2, b3) {
  return [b1 >> 2, ((b1 & 3) << 4) | (b2 >> 4), ((b2 & 15) << 2) | (b3 >> 6), b3 & 63]
    .map((n) => ALPHABET[n])
    .join('');
}

export function encodePlantUml(text) {
  const data = deflateRawSync(Buffer.from(text, 'utf8'), { level: 9 });
  let out = '';
  for (let i = 0; i < data.length; i += 3)
    out += threeBytes(data[i], data[i + 1] ?? 0, data[i + 2] ?? 0);
  return out;
}
