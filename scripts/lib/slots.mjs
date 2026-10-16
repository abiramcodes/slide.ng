// Slot sugar: a line with only `::name::` starts the named slot `name` (Slidev has the same syntax).
// Everything before the first marker belongs to the `default` slot, and `::default::` can switch back to it.
const MARKER = /^::\s*([\w.\-:]+)\s*::\s*$/;

// Returns [[name, markdown], ...] in order of first appearance. Always starts with `default`.
export function splitSlots(markdown) {
  const slots = new Map([['default', []]]);
  let name = 'default';
  let fence = 0; // number of backticks of the open fence, 0 outside code
  for (const line of markdown.split('\n')) {
    // a `::x::` inside a code sample is just text; a longer fence may hold shorter ones (magic-move)
    const ticks = /^(`{3,})/.exec(line)?.[1].length ?? 0;
    if (ticks && !fence) fence = ticks;
    else if (ticks >= fence && /^`+\s*$/.test(line)) fence = 0;
    const marker = !fence && MARKER.exec(line);
    if (marker) {
      name = marker[1];
      if (!slots.has(name)) slots.set(name, []);
    } else {
      slots.get(name).push(line);
    }
  }
  return [...slots].map(([n, lines]) => [n, lines.join('\n')]);
}
