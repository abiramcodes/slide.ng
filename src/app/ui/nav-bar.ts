import { Component, ElementRef, inject } from '@angular/core';
import { Dark } from '../lib/dark';
import { Fullscreen } from '../lib/fullscreen';
import { Nav } from '../lib/nav';
import { Ui } from '../lib/ui-state';
import { IconBtn } from './icon-btn';
import { Settings } from './settings';

// The bar at the bottom left (Slidev's NavControls). The deck shows it only while the mouse is
// over that corner. Drawing and presenter mode come in later phases, so those buttons are placeholders.
@Component({
  selector: 'app-nav-bar',
  imports: [IconBtn, Settings],
  host: { '(document:click)': 'closeSettingsOutside($event)' },
  template: `
    <nav class="flex flex-col" [attr.data-fullscreen]="fullscreen.isFullscreen()">
      <div class="flex flex-wrap-reverse text-xl gap-0.5 p-1 lg:p-2 rounded-md bg-main text-main shadow-xl border border-main">
        <button icon-btn id="nav-fullscreen" [title]="fullscreen.isFullscreen() ? 'Close fullscreen' : 'Enter fullscreen'" (click)="fullscreen.toggle()">
          <div [class]="fullscreen.isFullscreen() ? 'i-carbon:minimize' : 'i-carbon:maximize'"></div>
        </button>
        <button icon-btn id="nav-prev" title="Go to previous slide" [disabled]="!nav.hasPrev()" (click)="nav.prev()">
          <div class="i-carbon:arrow-left"></div>
        </button>
        <button icon-btn id="nav-next" title="Go to next slide" [disabled]="!nav.hasNext()" (click)="nav.next()">
          <div class="i-carbon:arrow-right"></div>
        </button>
        <button icon-btn id="nav-overview" title="Show slide overview" (click)="ui.toggleOverview()">
          <div class="i-carbon:apps"></div>
        </button>
        @if (!dark.isFixed) {
          <button icon-btn id="nav-dark" [title]="dark.isDark() ? 'Switch to light mode theme' : 'Switch to dark mode theme'" (click)="dark.toggle()">
            <div [class]="dark.isDark() ? 'i-carbon-moon' : 'i-carbon-sun'"></div>
          </button>
        }

        <div class="w-1px opacity-10 bg-current m-1 lg:m-2"></div>

        <button icon-btn id="nav-drawing" title="Show drawing toolbar (coming in phase 3)" [disabled]="true">
          <div class="i-carbon:pen"></div>
        </button>

        <div class="w-1px opacity-10 bg-current m-1 lg:m-2"></div>

        <button icon-btn id="nav-presenter" title="Presenter Mode (coming in a later phase)" [disabled]="true">
          <div class="i-carbon:user-speaker"></div>
        </button>
        <button icon-btn id="nav-info" title="Show info" (click)="ui.info.set(!ui.info())">
          <div class="i-carbon:information"></div>
        </button>

        <div class="w-1px opacity-10 bg-current m-1 lg:m-2"></div>

        <div class="flex relative" #menu>
          <button icon-btn id="nav-settings" title="More Options" [active]="ui.settings()" (click)="ui.settings.set(!ui.settings())">
            <div class="i-carbon:settings-adjust"></div>
          </button>
          @if (ui.settings()) {
            <div id="settings-menu" class="bg-main text-main shadow-xl absolute bottom-10 left-0 z-menu py-2 border border-main rounded-md">
              <app-settings />
            </div>
          }
        </div>

        <div class="w-1px opacity-10 bg-current m-1 lg:m-2"></div>

        <div id="nav-counter" class="px-2 my-auto">
          <span class="text-lg">{{ nav.no() }}</span>
          <span class="opacity-50 text-sm"> / {{ nav.total }}</span>
        </div>
      </div>
    </nav>
  `,
})
export class NavBar {
  protected nav = inject(Nav);
  protected ui = inject(Ui);
  protected dark = inject(Dark);
  protected fullscreen = inject(Fullscreen);
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  // A click anywhere outside the bar closes the settings menu.
  closeSettingsOutside(e: MouseEvent) {
    if (this.ui.settings() && !this.el.contains(e.target as Node)) this.ui.settings.set(false);
  }
}
