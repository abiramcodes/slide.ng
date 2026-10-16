// The WebSocket sync transport: every message one window sends goes to all the other windows.
// The hub keeps no state. It only passes on `{ channel, data }` for the channels the app uses, and drops the rest.
import { WebSocketServer } from 'ws';

const CHANNELS = new Set(['shared', 'drawings', 'hello']);
export const MAX_MESSAGE = 600_000; // a drawing of 500 000 characters fits, a bigger message closes the connection

/** Is this text one message the app could have sent? */
export function isMessage(text) {
  try {
    const m = JSON.parse(text);
    return !!m && typeof m === 'object' && CHANNELS.has(m.channel) && 'data' in m;
  } catch {
    return false;
  }
}

export function createHub() {
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE });
  wss.on('connection', (socket) => {
    // A message over the limit makes `ws` close the connection and raise an error: that must not stop the server.
    socket.on('error', () => {});
    socket.on('message', (raw, isBinary) => {
      const text = raw.toString();
      if (isBinary || !isMessage(text)) return;
      for (const other of wss.clients)
        if (other !== socket && other.readyState === other.OPEN) other.send(text);
    });
  });
  return wss;
}
