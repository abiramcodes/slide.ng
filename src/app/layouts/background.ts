// Style for a slide background, from a frontmatter value (port of Slidev's handleBackground).
// A colour (#... or rgb...) is used as it is; anything else is an image address.
// Keys are written with dashes because that is what an Angular [style] binding wants.
export function background(value?: string, dim = false, size = 'cover'): Record<string, string> {
  if (!value) return {};
  if (value[0] === '#' || value.startsWith('rgb')) return { background: value };
  return {
    color: 'white',
    // The dim layer makes white text readable on top of a photo.
    'background-image': dim ? `linear-gradient(#0005, #0008), url("${value}")` : `url("${value}")`,
    'background-repeat': 'no-repeat',
    'background-position': 'center',
    'background-size': size,
  };
}
