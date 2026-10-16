// Per-slide <style> blocks. We cut them out of the markdown (outside code fences) and
// return the CSS separately; emit.mjs puts it into the slide component, scoped to that slide.
export function extractStyles(markdown) {
  const css = [];
  // Splitting with a capture group puts the code fences at the odd positions.
  const parts = markdown.split(/(^```.*\n[\s\S]*?^```$)/gm);
  const text = parts
    .map((part, i) =>
      i % 2
        ? part
        : part.replace(
            /<style[^>]*>([\s\S]*?)<\/style>/g,
            (_, body) => (css.push(body.trim()), ''),
          ),
    )
    .join('');
  return { markdown: text, css: css.join('\n') };
}

// The slide's host tag (`slide-003`) is the scope: `slide-003 { h1 { color: red } }` uses
// native CSS nesting, so every selector the author writes only matches inside this slide.
export const scopeCss = (css, selector) => (css ? `${selector} {\n${css}\n}` : '');
