// GitHub alerts: a blockquote that starts with [!NOTE], [!TIP], [!IMPORTANT], [!WARNING] or [!CAUTION].
// We work on the HTML the markdown converter made, so quoted lists and code inside an alert still work.

// Title and Carbon icon for each kind.
const KINDS = {
  note: ['Note', 'information'],
  tip: ['Tip', 'idea'],
  important: ['Important', 'chat'],
  warning: ['Warning', 'warning'],
  caution: ['Caution', 'error'],
};

const OPEN = /<blockquote>\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:<br>\s*|\n)?/i;

export function markAlerts(html) {
  for (let m = OPEN.exec(html); m; m = OPEN.exec(html)) {
    const kind = m[1].toLowerCase();
    const [title, icon] = KINDS[kind];
    let start = m.index + m[0].length;
    let body = '<p>';
    if (html.startsWith('</p>', start)) {
      start += 4;
      body = '';
    } // the marker was alone on its line
    const head = `<div class="markdown-alert markdown-alert-${kind}"><p class="markdown-alert-title"><span class="i-carbon:${icon}"></span>${title}</p>${body}`;
    const end = matchingClose(html, start);
    html =
      html.slice(0, m.index) +
      head +
      html.slice(start, end) +
      '</div>' +
      html.slice(end + '</blockquote>'.length);
  }
  return html;
}

// Index of the </blockquote> that closes the one we are inside (quotes can be nested).
function matchingClose(html, from) {
  const tag = /<(\/?)blockquote>/g;
  tag.lastIndex = from;
  let depth = 1;
  for (let m = tag.exec(html); m; m = tag.exec(html)) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return m.index;
  }
  return html.length; // not closed: cannot happen with converter output
}
