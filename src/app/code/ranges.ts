// Line ranges of code blocks: "2,3", "5-8", "*", "all", "none". Port of Slidev's parseRangeString.

/** The line numbers a range names. `total` is the last line number of the block. */
export function parseRange(total: number, text?: string): number[] {
  if (!text || text === 'all' || text === '*') return Array.from({ length: total }, (_, i) => i + 1);
  if (text === 'none') return [];
  const lines = new Set<number>();
  for (const part of text.split(/[,;]/)) {
    if (!part.includes('-')) { lines.add(+part); continue; }
    const [from, to] = part.split('-', 2);
    // "3-" means "from 3 to the end"
    for (let n = +from; n <= (to ? +to : total); n++) lines.add(n);
  }
  return [...lines].filter((n) => n <= total).sort((a, b) => a - b);
}

/**
 * Marks the lines named by `text` as highlighted and all others as dimmed.
 * `lines[i]` are the elements of the i-th line (a line can be several elements).
 */
export function highlightLines(lines: Element[][], text: string, startLine: number) {
  const wanted = parseRange(lines.length + startLine - 1, text);
  lines.forEach((parts, i) => {
    const on = wanted.includes(i + startLine);
    for (const el of parts) {
      el.classList.toggle('slidev-code-highlighted', on);
      el.classList.toggle('slidev-code-dishonored', !on);
      // the older names, which themes and CSS written for Slidev still use
      el.classList.toggle('highlighted', on);
      el.classList.toggle('dishonored', !on);
    }
  });
}

/** Which range applies at which click. `index` 0 is "before the first click". */
export function rangeAt(ranges: string[], index: number, finalRange: string) {
  let text = ranges[index] ?? finalRange;
  const hide = text === 'hide';
  // `hide` hides the whole block; the next range is what shows once it appears
  if (hide) text = ranges[index + 1] ?? finalRange;
  return { text, hide };
}
