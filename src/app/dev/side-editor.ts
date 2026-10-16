import { Component, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { Nav } from '../lib/nav';
import { DevApi } from './dev-api';
import { SideEditorState } from './side-editor-state';

type Status = 'loading' | 'saved' | 'saving' | 'error';
const SAVE_DELAY = 600;
// How often an open editor looks at the file for changes made elsewhere (another editor, git, the MCP server).
const WATCH_EVERY = 2000;

// A plain text box with the markdown of the current slide (frontmatter, content and notes). Typing saves it
// into slides.md through the dev server; the generator rebuilds and the slide on the left updates.
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
        <textarea
          id="editor-text" spellcheck="false" class="flex-auto p-3 bg-transparent outline-none resize-none font-mono text-sm"
          [value]="text()" [disabled]="status() === 'loading'" (input)="edit($any($event.target).value)"
        ></textarea>
      </aside>
    }
  `,
})
export class SideEditor {
  protected nav = inject(Nav);
  protected state = inject(SideEditorState);
  private api = inject(DevApi);
  protected text = signal('');
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
    const watch = setInterval(() => void this.refresh(), WATCH_EVERY);
    inject(DestroyRef).onDestroy(() => clearInterval(watch));
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
