// A small text edit for the first frontmatter block of a markdown deck: set one top-level key (used by `theme eject`).
// It works on lines, so comments and the rest of the file stay as they are. The value is written as plain YAML text.

/** Sets `key: value` in the first frontmatter block, or makes one. `value` must be a simple string (no newline). */
export function setHeadmatterKey(markdown, key, value) {
  if (/[\n\r]/.test(value)) throw new Error('value must be one line');
  const line = `${key}: ${value}`;
  const lines = markdown.split('\n');
  const first = lines.findIndex((l) => l.trim() !== '');
  // No frontmatter: make a block at the top.
  if (first < 0 || lines[first].trim() !== '---') return `---\n${line}\n---\n\n${markdown}`;
  const close = lines.findIndex((l, i) => i > first && l.trim() === '---');
  if (close < 0) return `---\n${line}\n---\n\n${markdown}`; // an unclosed block is not frontmatter
  const existing = lines.findIndex((l, i) => i > first && i < close && new RegExp(`^${key}\\s*:`).test(l));
  if (existing >= 0) lines[existing] = line;
  else lines.splice(first + 1, 0, line);
  return lines.join('\n');
}
