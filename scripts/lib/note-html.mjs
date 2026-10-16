// Speaker notes -> HTML for the presenter page. `[click]` markers (at the start of a line or
// list item) become spans that the browser uses to highlight the part for the current click:
//   [click]    the next click       [click:3]  skip two clicks (same rule as Slidev's click markers)
import { marked } from 'marked';

/** @param {string | null | undefined} note @returns {string | null} */
export function noteToHtml(note) {
  if (!note || !note.trim()) return null;
  let clicks = 0;
  const withMarks = note.replace(/\[click(?::(\d+))?\]/gi, (_, n = '1') => {
    clicks += Number(n);
    return `<span class="slidev-note-click-mark" data-clicks="${clicks}"></span>`;
  });
  return marked.parse(withMarks, { async: false });
}
