// Drawings arrive from other windows and devices as SVG text, and the browser would run an
// <img onerror> or <script> hidden in it. So the text is parsed and rebuilt from the few
// elements and attributes that drauu itself writes, and anything else is dropped.

const ALLOWED = new Set(['g', 'path', 'line', 'ellipse', 'rect', 'circle', 'polygon', 'polyline', 'defs', 'marker']);

function clean(el: Element) {
  for (const child of Array.from(el.children)) {
    if (!ALLOWED.has(child.localName)) { child.remove(); continue; }
    for (const attr of Array.from(child.attributes)) {
      const bad = /^on/i.test(attr.name) || /href|src/i.test(attr.name) || /javascript:|data:|url\((?!#)/i.test(attr.value);
      if (bad) child.removeAttribute(attr.name);
    }
    clean(child);
  }
}

/** The inner markup of a drawing, safe to put inside an <svg>. Text that is not valid SVG gives ''. */
export function cleanSvg(markup: string): string {
  if (!markup) return '';
  const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, 'image/svg+xml');
  if (doc.querySelector('parsererror')) return '';
  clean(doc.documentElement);
  const serializer = new XMLSerializer();
  // The serializer adds the namespace to every child; the <svg> that holds the markup has it already.
  return Array.from(doc.documentElement.childNodes).map((n) => serializer.serializeToString(n).replace(/ xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '')).join('');
}

/** A whole SVG image of a drawing (for the overview and the next-step picture). */
export function drawingImageUrl(markup: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540">${markup}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
