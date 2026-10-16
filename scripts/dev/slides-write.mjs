// Changes slides.md (or a file it imports) on request of the page: a slide-ng-drag moved, or the side editor saved.
// The page only says "slide 3"; which file and which lines is found here, from the parser. A path never comes from a request.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { relative } from 'node:path';
import { parseDeck } from '../lib/parse-deck.mjs';
import { confine } from './auth.mjs';
import { HttpError } from './http-error.mjs';
import { dragEdit, replaceSource, sourceOf } from './slide-source.mjs';

/** The slide, the markdown file it is in, and that file's text, read now. */
async function locate(ctx, no) {
  if (!Number.isInteger(no) || no < 1) throw new HttpError(400, 'bad slide number');
  const deck = await parseDeck(ctx.entry);
  const slide = deck.slides[no - 1];
  if (!slide?.source) throw new HttpError(404, 'no such slide');
  const file = confine(ctx.root, relative(ctx.root, slide.source.filepath));
  if (!file || !file.endsWith('.md') || !existsSync(file))
    throw new HttpError(403, 'this slide is not in a file of the project');
  return {
    slide: { ...slide.source, content: slide.content },
    file,
    text: readFileSync(file, 'utf8'),
  };
}

function save(file, result) {
  if (result.error) throw new HttpError(422, result.error);
  writeFileSync(file, result.text);
}

/** A slide-ng-drag element was moved: write its new place. */
export async function writeDrag(ctx, no, site, pos) {
  const { slide, file, text } = await locate(ctx, no);
  save(file, dragEdit(text, slide, site, pos));
}

/** The raw markdown of a slide for the side editor. */
export async function readSlide(ctx, no) {
  const { slide, text } = await locate(ctx, no);
  return sourceOf(text, slide);
}

/** The side editor saved: replace the slide's lines. */
export async function writeSlide(ctx, no, raw) {
  const { slide, file, text } = await locate(ctx, no);
  save(file, replaceSource(text, slide, raw));
}
