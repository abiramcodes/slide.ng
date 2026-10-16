// The side editor's colours are fetched through this one function. A production build swaps it for `load-highlighter.prod.ts`
// (angular.json, fileReplacements), so the editor's Shiki files are not even written into a deck's build.
import type { Highlight } from './editor-highlight';

export const loadHighlighter = async (): Promise<Highlight | null> =>
  (await import('./editor-highlight')).createEditorHighlighter();
