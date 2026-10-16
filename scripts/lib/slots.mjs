// Slot sugar: a line with only `::name::` starts the named slot `name` (Slidev has the same syntax).
// Everything before the first marker belongs to the `default` slot, and `::default::` can switch back to it.
const MARKER = /^::\s*([\w.\-:]+)\s*::\s*$/;

// Returns [[name, markdown], ...] in order of first appearance. Always starts with `default`.
export function splitSlots(markdown) {
  const slots = new Map([['default', []]]);
  let name = 'default';
  let inFence = false;
  for (const line of markdown.split('\n')) {
    if (/^```/.test(line)) inFence = !inFence; // a `::x::` inside a code sample is just text
    const marker = !inFence && MARKER.exec(line);
    if (marker) {
      name = marker[1];
      if (!slots.has(name)) slots.set(name, []);
    } else {
      slots.get(name).push(line);
    }
  }
  return [...slots].map(([n, lines]) => [n, lines.join('\n')]);
}
