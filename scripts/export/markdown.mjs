// `--format md`: one markdown file with a picture and the notes of each slide, slides separated by `---`.
import { writeFile } from 'node:fs/promises';

/** `folder` is the name of the pictures' folder, relative to the markdown file. */
export function markdownText({ slides, pictures, folder }) {
  const slideNos = [...new Set(pictures.map((p) => p.no))];
  return slideNos.map((no) => {
    const slide = slides[no - 1];
    const images = pictures.filter((p) => p.no === no).map((p) => `![${slide.title || no}](./${folder}/${p.name})\n\n`).join('');
    return images + (slide.note ? `${slide.note.trim()}\n\n` : '');
  }).join('---\n\n');
}

export function writeMarkdown(file, options) {
  return writeFile(file, markdownText(options));
}
