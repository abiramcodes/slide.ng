import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { HEADMATTER } from '../slides/generated';
import { routes } from './app.routes';
import { BroadcastTransport } from './sync/broadcast-transport';
import { SYNC_TRANSPORTS } from './sync/transport';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Headmatter `routerMode: hash` puts the slide after a # (/#/3), for hosts that cannot send every path to index.html.
    provideRouter(routes, ...(HEADMATTER['routerMode'] === 'hash' ? [withHashLocation()] : [])),
    // Windows of the same browser stay in step through a BroadcastChannel.
    { provide: SYNC_TRANSPORTS, multi: true, useFactory: () => new BroadcastTransport() },
  ]
};
