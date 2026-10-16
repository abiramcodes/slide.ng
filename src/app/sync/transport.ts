// A transport carries small messages to the other windows or devices that show the same deck.
// SyncState only knows this interface, so a new way of travelling (a WebSocket to the dev
// server, say) is added by providing one more SYNC_TRANSPORTS entry. Nobody else changes.
import { InjectionToken } from '@angular/core';

export interface SyncTransport {
  /** Send to the others. A transport never delivers a message back to its sender. */
  send(channel: string, data: unknown): void;
  /** `handler` gets every message that others send. Nothing it receives can be trusted. */
  listen(handler: (channel: string, data: unknown) => void): void;
}

/** Every transport in use (`multi: true`): all of them send, all of them receive. */
export const SYNC_TRANSPORTS = new InjectionToken<SyncTransport[]>('SYNC_TRANSPORTS');
