import { diskScope } from '../lib/disk-scope';
import { SyncTransport } from './transport';

// Windows of the same browser (same address) talk through a BroadcastChannel.
// It needs no server, so it also works in a static build.
export class BroadcastTransport implements SyncTransport {
  // A folder opened from disk shares channels with every other one, so it adds its path to the name (disk-scope.ts).
  private channel = new BroadcastChannel(`slide-ng-sync${diskScope()}`);

  send(channel: string, data: unknown) {
    this.channel.postMessage({ channel, data });
  }

  listen(handler: (channel: string, data: unknown) => void) {
    this.channel.onmessage = (e: MessageEvent) => {
      const m = e.data;
      if (m && typeof m === 'object' && typeof m.channel === 'string') handler(m.channel, m.data);
    };
  }
}
