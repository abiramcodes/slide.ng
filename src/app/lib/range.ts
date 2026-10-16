// "1,3-5" -> [1, 3, 4, 5]. Same rules as Slidev's parseRangeString (the exporter in
// scripts/export uses the parser's own copy): `all` or empty = every slide, `none` = nothing,
// `4-` = from 4 to the end. Numbers outside 1..total are dropped.
export function parseRange(total: number, text?: string | null): number[] {
  const all = Array.from({ length: total }, (_, i) => i + 1);
  if (!text || text === 'all' || text === '*') return all;
  if (text === 'none') return [];
  const found = new Set<number>();
  for (const part of text.split(/[,;]/)) {
    const [from, to] = part.includes('-') ? part.split('-', 2) : [part, part];
    const first = Number(from);
    const last = to === '' ? total : Number(to);
    if (!Number.isInteger(first) || !Number.isInteger(last)) continue;
    for (let n = first; n <= last; n++) found.add(n);
  }
  return [...found].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
}
