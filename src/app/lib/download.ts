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
    // From a folder opened on disk (`build --offline`) a request cannot be asked; the build wrote the file next to the page.
    if (location.protocol === 'file:') this.available.set(!DOWNLOAD!.startsWith('http'));
    else if (!DOWNLOAD!.startsWith('http') && !DOWNLOAD!.startsWith('/')) void this.check(this.url);
    else this.available.set(true); // somebody else's address: take their word for it
  }

  /** Saves the file: a temporary link is clicked, which keeps the page where it is. */
  save() {
    if (!this.url) return;
    const link = Object.assign(document.createElement('a'), { href: this.url, download: '' });
    // A page opened from disk cannot make the browser save a file (`download` is ignored there), and showing the PDF in this tab
    // would take the deck away. A new tab keeps the deck where it is; the browser's PDF viewer has a save button.
    if (location.protocol === 'file:') Object.assign(link, { target: '_blank', rel: 'noopener' });
    link.click();
  }

  private async check(url: string) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      this.available.set(res.ok && (res.headers.get('content-type') ?? '').includes('pdf'));
    } catch { /* file:// or offline: stays unavailable */ }
  }
}
