/** Reads what the generator packed: base64 of raw-deflate compressed JSON. */
export async function unpack<T>(packed: string): Promise<T> {
  const bytes = Uint8Array.from(atob(packed), (c) => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return JSON.parse(await new Response(stream).text()) as T;
}
