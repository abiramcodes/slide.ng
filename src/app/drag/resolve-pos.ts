import { SLIDES } from '../../slides/generated';

/** `name` -> the frontmatter's `dragPos.name` of that slide; anything else already is a position and comes back unchanged. */
export function resolvePos(slideNo: number, text: string): string {
  if (!/^[A-Za-z_][\w-]*$/.test(text)) return text;
  const found = (SLIDES[slideNo - 1]?.frontmatter['dragPos'] as Record<string, unknown> | undefined)?.[text];
  return Array.isArray(found) ? found.join(',') : String(found ?? '');
}
