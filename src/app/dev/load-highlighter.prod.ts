// A static build has no side editor: nothing to load.
import type { Highlight } from './editor-highlight';

export const loadHighlighter = async (): Promise<Highlight | null> => null;
