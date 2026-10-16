import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Nav } from '../lib/nav';
import { DevApi } from './dev-api';
import type { Highlight } from './editor-highlight';
import { loadHighlighter } from './load-highlighter';
import { SideEditorState } from './side-editor-state';

type Status = 'loading' | 'saved' | 'saving' | 'error';
const SAVE_DELAY = 600;
// How often an open editor looks at the file for changes made elsewhere (another editor, git, the MCP server).
const WATCH_EVERY = 2000;

// The markdown of the current slide (frontmatter, content and notes) in a textarea. Like Slidev's editor, the text is coloured by Shiki
// (loaded the first time the editor opens, see editor-highlight.ts) and the textarea lies on top of the coloured copy. Typing saves it
// into slides.md through the dev server (Ctrl/Cmd+S at once); the generator rebuilds and the slide on the left updates.
@Component({
  selector: 'app-side-editor',
  template: `
    @if (state.open() && state.available()) {
      <aside id="side-editor" class="fixed right-0 top-0 bottom-0 z-nav flex flex-col bg-main text-main border-l border-main" [style.width.px]="state.width">
        <div class="flex items-center gap-2 px-3 py-1 border-b border-main text-sm">
          <span class="font-bold">Slide {{ nav.no() }}</span>
          <span id="editor-status" class="op60 ml-auto" [class.color-red-500]="status() === 'error'">{{ label() }}</span>
          <button type="button" id="editor-close" class="px-1" title="Close editor" (click)="state.toggle()"><div class="i-carbon:close"></div></button>
        </div>
        <div class="relative flex-auto overflow-auto" style="background-color: var(--slidev-code-background)">
          <div class="relative min-h-full">
            <!-- This copy gives the box its height; the textarea has the same size and wraps the same way. -->
            @if (html(); as coloured) {
              <div id="editor-highlight" class="editor-text" aria-hidden="true" [innerHTML]="coloured"></div>
            } @else {
              <div id="editor-sizer" class="editor-text invisible" aria-hidden="true">{{ text() }} </div>
            }
            <textarea
              id="editor-text" spellcheck="false" class="editor-text absolute inset-0 w-full h-full bg-transparent outline-none resize-none overflow-hidden"
              [class.highlighted]="!!html()" [value]="text()" [disabled]="status() === 'loading'"
              (input)="edit($any($event.target).value)" (keydown)="keydown($event)"
            ></textarea>
          </div>
        </div>
      </aside>
    }
  `,
})
export class SideEditor {
  protected nav = inject(Nav);
  protected state = inject(SideEditorState);
  private api = inject(DevApi);
  protected text = signal('');
  private highlight = signal<Highlight | null>(null);
  private sanitizer = inject(DomSanitizer);
  // The coloured copy of the text. Shiki escapes the text itself, so its HTML is safe to use as it is (Angular would remove its style attributes).
  protected html = computed(() => {
    const colour = this.highlight();
    return colour ? this.sanitizer.bypassSecurityTrustHtml(colour(this.text())) : null;
  });
  protected status = signal<Status>('loading');
  private timer?: ReturnType<typeof setTimeout>;
  private loadedNo = 0;

  protected label = () => ({ loading: 'Loading...', saved: 'Saved', saving: 'Saving...', error: 'Could not save' })[this.status()];

  constructor() {
    // Show the text of whichever slide is on screen. A change not saved yet goes out first.
    effect(() => {
      const no = this.nav.no(), open = this.state.open() && this.state.available();
      if (open && no !== this.loadedNo) untracked(() => void this.load(no));
    });
    // Shiki is fetched when the editor is first opened; until it arrives the text is plain. A production build has no editor and no chunk.
    effect(() => { if (this.state.open() && this.state.available() && !untracked(this.highlight)) untracked(() => void this.loadColours()); });
    const watch = setInterval(() => void this.refresh(), WATCH_EVERY);
    inject(DestroyRef).onDestroy(() => clearInterval(watch));
  }

  private async loadColours() {
    try { this.highlight.set(await loadHighlighter()); } catch { /* plain text still works */ }
  }

  protected keydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.code === 'KeyS') { event.preventDefault(); void this.flush(); }
  }

  // Takes over a change made outside, but only when nothing typed here is waiting to be saved.
  private async refresh() {
    if (!this.state.open() || !this.loadedNo || this.timer !== undefined || this.status() !== 'saved') return;
    const no = this.loadedNo, shown = this.text();
    const got = await this.api.get<{ raw: string }>(`/slides/${no}/source`);
    // The user may have typed, or moved to another slide, while we asked.
    if (!got || this.timer !== undefined || this.status() !== 'saved' || this.loadedNo !== no || this.text() !== shown) return;
    if (got.raw !== shown) this.text.set(got.raw);
  }

  private async load(no: number) {
    await this.flush();
    this.status.set('loading');
    const got = await this.api.get<{ raw: string }>(`/slides/${no}/source`);
    if (this.nav.no() !== no) return; // moved on while waiting
    this.loadedNo = no;
    this.text.set(got?.raw ?? '');
    this.status.set(got ? 'saved' : 'error');
  }

  protected edit(value: string) {
    this.text.set(value);
    this.status.set('saving');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), SAVE_DELAY);
  }

  private async flush() {
    if (this.timer === undefined) return;
    clearTimeout(this.timer);
    this.timer = undefined;
    const ok = await this.api.send('PUT', `/slides/${this.loadedNo}/source`, { raw: this.text() });
    this.status.set(ok ? 'saved' : 'error');
  }
}
