// Picture output: a screenshot of every `.print-slide-container`.
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Hides every background so a screenshot with `omitBackground` really is transparent. */
export function makeTransparent(page) {
  return page.addStyleTag({
    content: 'html, body, .print-slide-container { background: transparent !important; }',
  });
}

/** File name of a picture: `001.png`, or `001-01.png` (the page's id) when there is one per click. */
export function pictureName({ id, no }, withClicks) {
  return `${withClicks ? id : String(no).padStart(3, '0')}.png`;
}

/** Screenshots the pages of the loaded print page. Returns `{ no, id, name, buffer }` for each. */
export async function screenshotPages(
  page,
  pages,
  { omitBackground, withClicks, onEach = () => {} },
) {
  if (omitBackground) await makeTransparent(page);
  const containers = page.locator('.print-slide-container');
  const result = [];
  for (let i = 0; i < pages.length; i++) {
    const buffer = await containers.nth(i).screenshot({ omitBackground });
    result.push({ ...pages[i], name: pictureName(pages[i], withClicks), buffer });
    onEach(i);
  }
  return result;
}

/** Writes pictures into `dir` (created if needed). Only these files are written; nothing is ever deleted. */
export async function writePictures(dir, pictures) {
  await mkdir(dir, { recursive: true });
  for (const p of pictures) await writeFile(join(dir, p.name), p.buffer);
}
