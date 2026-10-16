import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { BroadcastTransport } from './sync/broadcast-transport';
import { SYNC_TRANSPORTS } from './sync/transport';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Windows of the same browser stay in step through a BroadcastChannel.
    { provide: SYNC_TRANSPORTS, multi: true, useFactory: () => new BroadcastTransport() },
  ]
};
