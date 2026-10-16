// Finds the code samples of the agent skill that must build. A sample is a fenced `md` block that comes right after the
// comment `<!-- verify -->`: a whole deck or whole slides. A fence after `<!-- verify-file: path -->` is a file that the
// samples of the same page need next to their slides.md (a component, a snippet, an imported slides file).
// Everything else (fragments, shell, other languages) is left alone, and nothing inside an unmarked fence is read as a marker.
const VERIFY = /^<!--\s*verify\s*-->$/;
const VERIFY_FILE = /^<!--\s*verify-file:\s*(\S+)\s*-->$/;
const OPEN = /^(`{3,}|~{3,})\s*(.*)$/;

/**
 * @param {string} text  a markdown page
 * @param {string} file  its name, for messages
 * @returns {{ samples: {id: string, line: number, text: string}[], files: {path: string, line: number, text: string}[], problems: string[], unmarked: number }}
 */
export function extractSamples(text, file = 'page.md') {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const samples = [];
  const files = [];
  const problems = [];
  let unmarked = 0;
  let armed = null; // { kind: 'verify' | 'file', path?, line }

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const open = OPEN.exec(lines[i]);

    if (!open) {
      if (armed && trimmed !== '') {
        problems.push(`${file}:${armed.line}: the marker is not followed by a code fence`);
        armed = null;
      }
      if (VERIFY.test(trimmed)) armed = { kind: 'verify', line: i + 1 };
      const asFile = VERIFY_FILE.exec(trimmed);
      if (asFile) armed = { kind: 'file', path: asFile[1], line: i + 1 };
      continue;
    }

    // A fence: find its end, then decide what it is.
    const [, ticks, info] = open;
    let end = i + 1;
    while (
      end < lines.length &&
      !new RegExp(`^${ticks[0]}{${ticks.length},}\\s*$`).test(lines[end])
    )
      end++;
    if (end >= lines.length) problems.push(`${file}:${i + 1}: the code fence is never closed`);
    const body = lines.slice(i + 1, end).join('\n') + '\n';

    if (armed?.kind === 'verify') {
      if (!/^md(\s|$)/.test(info))
        problems.push(`${file}:${armed.line}: <!-- verify --> needs an md fence`);
      else samples.push({ id: `${file}#${samples.length + 1}`, line: i + 1, text: body });
    } else if (armed?.kind === 'file') {
      if (/^\/|\.\.|\\/.test(armed.path))
        problems.push(
          `${file}:${armed.line}: the file path "${armed.path}" must be relative and stay inside the deck`,
        );
      else files.push({ path: armed.path, line: i + 1, text: body });
    } else if (/^md(\s|$)/.test(info)) unmarked++;
    armed = null;
    i = end;
  }
  if (armed) problems.push(`${file}:${armed.line}: the marker is not followed by a code fence`);
  return { samples, files, problems, unmarked };
}
