// An embedded YouTube video:  <youtube id="luoMHjh-XcQ" width="560" height="315" />
import { Component, computed, inject, input, numberAttribute } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'youtube',
  host: { style: 'display: inline-block' },
  template: `
    <iframe class="youtube" [attr.width]="width()" [attr.height]="height()" [src]="src()" title="YouTube" frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
  `,
})
export class Youtube {
  id = input.required<string>();
  width = input(undefined, { transform: (v: unknown) => (v == null ? undefined : numberAttribute(v)) });
  height = input(undefined, { transform: (v: unknown) => (v == null ? undefined : numberAttribute(v)) });
  private sanitizer = inject(DomSanitizer);
  // Angular does not allow a computed address for an iframe unless it is marked as trusted; it is YouTube's own address.
  protected src = computed(() => this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${encodeURIComponent(this.id())}`));
}
