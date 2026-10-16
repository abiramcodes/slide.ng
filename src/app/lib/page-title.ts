/**
 * The title of the browser tab for a slide. With the headmatter's `titleTemplate` (`%s | My talk`) the template gets the
 * slide's title (or the deck's title when the slide has none). Without one it is "slide title - deck title".
 */
export function documentTitle(
  slideTitle: string | null,
  headmatter: Record<string, unknown>,
): string {
  const deck = typeof headmatter['title'] === 'string' ? headmatter['title'] : null;
  const template = headmatter['titleTemplate'];
  if (typeof template === 'string' && template)
    return template.replaceAll('%s', slideTitle || deck || 'slide.ng');
  return (
    [slideTitle, deck].filter((t, i, all) => t && all.indexOf(t) === i).join(' - ') || 'slide.ng'
  );
}
