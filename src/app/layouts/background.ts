// Style for a slide background, from a frontmatter value (port of Slidev's handleBackground).
// A colour (#... or rgb...) is used as it is; anything else is an image address.
// Keys are written with dashes because that is what an Angular [style] binding wants.

/** The folder the app is served from, ending in a slash (`/` or `/talk/`), from the page's <base>. */
function baseUrl(): string {
  try {
    const path = new URL(document.baseURI).pathname;
    return path.endsWith('/') ? path : `${path.slice(0, path.lastIndexOf('/') + 1)}`;
  } catch {
    return '/';
  }
}

/** `/pic.png` is relative to the deck's base (`/talk/pic.png` in a deck built with `--base /talk/`), like Slidev's resolveAssetUrl. */
export function resolveAssetUrl(url: string): string {
  return url.startsWith('/') && !url.startsWith('//') ? baseUrl() + url.slice(1) : url;
}

export function background(value?: string, dim = false, size = 'cover'): Record<string, string> {
  if (!value) return {};
  if (value[0] === '#' || value.startsWith('rgb')) return { background: value };
  const url = resolveAssetUrl(value);
  return {
    color: 'white',
    // The dim layer makes white text readable on top of a photo.
    'background-image': dim ? `linear-gradient(#0005, #0008), url("${url}")` : `url("${url}")`,
    'background-repeat': 'no-repeat',
    'background-position': 'center',
    'background-size': size,
  };
}
