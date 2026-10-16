// Structural edits of a markdown deck as plain text in, text out: remove, insert and move whole slides.
// The parser says where each slide is (`start`, `contentStart`, `end`, in lines). A slide that has frontmatter starts at its
// opening `---`; one without starts after a plain `---` separator line, which belongs to no slide. Here a "block" is a slide
// together with its separator, so blocks can be cut and pasted. The caller checks the result by parsing it again (see tools.mjs).

const isSeparator = (line) => /^---+\s*$/.test(line ?? '');

/** The line ranges [from, to) of every slide's block. Slide 1 has no separator of its own: it carries the headmatter. */
function blocksOf(lines, slides) {
  const starts = slides.map((s, i) => {
    if (i === 0) return 0;
    const from = s.contentStart > s.start ? s.start : s.start - 1;
    if (!isSeparator(lines[from]))
      throw new Error(
        `slide ${i + 1} does not start with a --- line where the parser says it does; edit the file by hand`,
      );
    return from;
  });
  let last = lines.length;
  while (last > 0 && lines[last - 1].trim() === '') last--;
  return starts.map((from, i) => ({ from, to: i + 1 < starts.length ? starts[i + 1] : last }));
}

const trimEnd = (lines) => {
  const out = [...lines];
  while (out.length && out[out.length - 1].trim() === '') out.pop();
  return out;
};

// Work with \n inside, give the file its own line ending back, and end it with one newline.
function edit(text, change) {
  const crlf = text.includes('\r\n');
  const result = change(text.replace(/\r\n/g, '\n').split('\n'));
  const joined = trimEnd(result).join('\n') + '\n';
  return crlf ? joined.replace(/\n/g, '\r\n') : joined;
}

function checkNumber(no, count, what) {
  if (!Number.isInteger(no) || no < 1 || no > count)
    throw new Error(`${what} must be a slide number from 1 to ${count}, got ${no}`);
}

const FIRST =
  "slide 1 carries the deck's headmatter, so it cannot be removed or moved, and nothing can be put before it";

/** The text without slide `no`. */
export function removeSlide(text, slides, no) {
  checkNumber(no, slides.length, 'no');
  if (no === 1) throw new Error(FIRST);
  return edit(text, (lines) => {
    const { from, to } = blocksOf(lines, slides)[no - 1];
    return [...lines.slice(0, from), ...lines.slice(to)];
  });
}

/** The text with `raw` (a slide as written in the file, starting with its `---` line) after slide `after`. */
export function insertSlide(text, slides, after, raw) {
  checkNumber(after, slides.length, 'after');
  if (!isSeparator(raw.split('\n')[0])) throw new Error('the new slide must start with a --- line');
  return edit(text, (lines) => {
    const at = blocksOf(lines, slides)[after - 1].to;
    const before = trimEnd(lines.slice(0, at));
    return [...before, '', ...trimEnd(raw.split('\n')), '', ...lines.slice(at)];
  });
}

/** The text with slide `from` moved so that it becomes slide `to`. */
export function moveSlide(text, slides, from, to) {
  checkNumber(from, slides.length, 'from');
  checkNumber(to, slides.length, 'to');
  if (from === 1 || to === 1) throw new Error(FIRST);
  return edit(text, (lines) => {
    const blocks = blocksOf(lines, slides);
    const parts = blocks.map((b) => lines.slice(b.from, b.to));
    const [moved] = parts.splice(from - 1, 1);
    parts.splice(to - 1, 0, moved);
    // One blank line after each part keeps `---` from touching the text above it.
    return parts.flatMap((p, i) => (i === parts.length - 1 ? trimEnd(p) : [...trimEnd(p), '']));
  });
}
