// Packs a value into a short attribute string: JSON, raw-deflate, base64. The browser side is src/app/code/unpack.ts.
// Used for text that would otherwise need escaping in a template (diagram and editor code, magic-move tokens).
import { deflateRawSync } from 'node:zlib';

export const pack = (value) => deflateRawSync(JSON.stringify(value)).toString('base64');
