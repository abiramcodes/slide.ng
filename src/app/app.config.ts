import { ApplicationConfig, inject, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { HEADMATTER } from '../slides/generated';
import { routes } from './app.routes';
import { DevApi } from './dev/dev-api';
import { DRAG_SAVER } from './drag/drag-state';
import { WebSocketTransport } from './dev/ws-transport';
import { BroadcastTransport } from './sync/broadcast-transport';
import { SYNC_TRANSPORTS } from './sync/transport';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Headmatter `routerMode: hash` puts the slide after a # (/#/3), for hosts that cannot send every path to index.html.
    provideRouter(routes, ...(HEADMATTER['routerMode'] === 'hash' ? [withHashLocation()] : [])),
    // Windows of the same browser stay in step through a BroadcastChannel.
    { provide: SYNC_TRANSPORTS, multi: true, useFactory: () => new BroadcastTransport() },
    // While developing, the companion server (scripts/dev) also carries sync between devices and writes slides.md.
    ...(isDevMode() ? [
      { provide: SYNC_TRANSPORTS, multi: true, useFactory: () => new WebSocketTransport(inject(DevApi)) },
      { provide: DRAG_SAVER, useFactory: () => { const api = inject(DevApi); return (s: { slide: number; site: number; pos: string }) => void api.send('POST', `/slides/${s.slide}/drag`, { site: s.site, pos: s.pos }); } },
    ] : []),
  ]
};
