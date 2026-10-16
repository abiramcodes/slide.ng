import { Injectable, isDevMode, signal } from '@angular/core';
import { DOWNLOAD } from '../../slides/generated';

/**
 * The "Download PDF" button (headmatter `download`). The file is made by `slide-ng build --download` and sits next to
 * the page, so the button only works in a static build that really contains it: the page asks the server (HEAD) and
 * checks that the answer is a PDF (many hosts answer a missing file with index.html).
 */
@Injectable({ providedIn: 'root' })
export class Download {
  /** The deck asked for a download button. */
  readonly wanted = DOWNLOAD !== null;
  readonly url = DOWNLOAD ? new URL(DOWNLOAD, document.baseURI).href : null;
  readonly available = signal(false);

  constructor() {
    if (!this.url || isDevMode()) return;
    if (!DOWNLOAD!.startsWith('http') && !DOWNLOAD!.startsWith('/')) void this.check(this.url);
    else this.available.set(true); // somebody else's address: take their word for it
  }

  /** Saves the file: a temporary link is clicked, which keeps the page where it is. */
  save() {
    if (!this.url) return;
    const link = Object.assign(document.createElement('a'), { href: this.url, download: '' });
    link.click();
  }

  private async check(url: string) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      this.available.set(res.ok && (res.headers.get('content-type') ?? '').includes('pdf'));
    } catch { /* file:// or offline: stays unavailable */ }
  }
}
