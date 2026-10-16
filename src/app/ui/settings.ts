import { Component, inject } from '@angular/core';
import { Dark } from '../lib/dark';
import { Download } from '../lib/download';
import { Nav } from '../lib/nav';
import { Ui } from '../lib/ui-state';
import { WakeLock } from '../lib/wake-lock';
import { PresenterPrefs } from '../presenter/prefs';
import { DevicesSelectors } from '../record/devices-selectors';
import { FilterSettings } from './filter-settings';

// The content of the settings menu ("More Options").
@Component({
  selector: 'app-settings',
  imports: [DevicesSelectors, FilterSettings],
  template: `
    <div class="text-sm select-none flex flex-col gap-1 min-w-60 px-4 max-h-[70vh] overflow-auto">
      @if (!dark.isFixed) {
        <label class="flex items-center gap-4 cursor-pointer">
          <span class="mr-auto">Dark Mode</span>
          <input
            type="checkbox"
            id="settings-dark"
            [checked]="dark.isDark()"
            (change)="dark.toggle()"
          />
        </label>
      }
      <div class="flex items-center gap-4">
        <span class="mr-auto">Slide Scale</span>
        <div class="flex rounded border border-main overflow-hidden">
          <button
            type="button"
            id="scale-fit"
            class="px-2 py-0.5"
            [class.bg-active]="!ui.slideScale()"
            (click)="ui.slideScale.set(0)"
          >
            Fit
          </button>
          <button
            type="button"
            id="scale-1"
            class="px-2 py-0.5"
            [class.bg-active]="ui.slideScale() === 1"
            (click)="ui.slideScale.set(1)"
          >
            1:1
          </button>
        </div>
      </div>
      <label class="flex items-center gap-4 cursor-pointer">
        <span class="mr-auto">Hide Idle Cursor</span>
        <input
          type="checkbox"
          id="hide-idle-cursor"
          [checked]="ui.hideIdleCursor()"
          (change)="ui.hideIdleCursor.set(!ui.hideIdleCursor())"
        />
      </label>
      @if (wake.supported) {
        <label class="flex items-center gap-4 cursor-pointer">
          <span class="mr-auto">Keep Screen Awake</span>
          <input
            type="checkbox"
            id="wake-lock"
            [attr.data-held]="wake.held()"
            [checked]="wake.enabled()"
            (change)="wake.enabled.set(!wake.enabled())"
          />
        </label>
      }
      @if (nav.isPresenter) {
        <div class="h-1px bg-current op10 my-1"></div>
        <label class="flex items-center gap-4 cursor-pointer">
          <span class="mr-auto">Show Presenter Cursor</span>
          <input
            type="checkbox"
            id="settings-cursor"
            [checked]="prefs.showCursor()"
            (change)="prefs.toggleCursor()"
          />
        </label>
        <div class="flex items-center gap-4">
          <span class="mr-auto">Cursor Style</span>
          <div class="flex rounded border border-main overflow-hidden">
            <button
              type="button"
              id="cursor-style-cursor"
              class="px-2 py-0.5"
              [class.bg-active]="prefs.cursorStyle() === 'cursor'"
              (click)="prefs.cursorStyle.set('cursor')"
            >
              Pointer
            </button>
            <button
              type="button"
              id="cursor-style-laser"
              class="px-2 py-0.5"
              [class.bg-active]="prefs.cursorStyle() === 'laser'"
              (click)="prefs.cursorStyle.set('laser')"
            >
              Laser
            </button>
          </div>
        </div>
      }
      <div class="h-1px bg-current op10 my-1"></div>
      <app-filter-settings />
      <div class="h-1px bg-current op10 my-1"></div>
      <app-devices-selectors />
      @if (download.wanted) {
        <div class="h-1px bg-current op10 my-1"></div>
        @if (download.available()) {
          <button type="button" id="download-pdf" class="text-left" (click)="download.save()">
            Download as PDF
          </button>
        } @else {
          <button
            type="button"
            id="download-pdf"
            class="text-left op40 cursor-not-allowed"
            disabled
            title="The PDF is added by: slide-ng build --download"
          >
            Download as PDF
          </button>
        }
      }
    </div>
  `,
})
export class Settings {
  protected ui = inject(Ui);
  protected dark = inject(Dark);
  protected nav = inject(Nav);
  protected prefs = inject(PresenterPrefs);
  protected wake = inject(WakeLock);
  protected download = inject(Download);
}
