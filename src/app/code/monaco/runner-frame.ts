// The page that runs code for `{monaco-run}`. It lives in a sandboxed <iframe srcdoc> with no access to the
// slides, their storage or the network origin, and sends what the code logs back with postMessage.
// This is plain JavaScript in a string on purpose: it is a separate page, not part of the app.

export function frameHtml(js: string, id: string): string {
  // `<` is escaped so the code cannot close the <script> tag early.
  const safe = (v: string) => JSON.stringify(v).replace(/</g, '\\u003c');
  return `<!doctype html><script>
const ID = ${safe(id)};
const send = (message) => parent.postMessage({ id: ID, ...message }, '*');

// How a value is shown in the output: strings as they are, other things like console.log in a browser.
function show(arg) {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return 'Error: ' + JSON.stringify(arg.message);
  if (arg === null || arg === undefined || typeof arg === 'symbol') return String(arg);
  if (Array.isArray(arg)) return '[' + arg.map(show).join(', ') + ']';
  if (arg instanceof Set) return 'Set (' + arg.size + ') {' + [...arg].map(show).join(', ') + '}';
  if (arg instanceof Map) return 'Map (' + arg.size + ') {' + [...arg].map(([k, v]) => show(k) + ' => ' + show(v)).join(', ') + '}';
  if (arg instanceof RegExp) return arg.toString();
  if (typeof arg === 'function') return String(arg);
  if (typeof arg === 'object') {
    const name = arg.constructor && arg.constructor.name && arg.constructor.name !== 'Object' ? arg.constructor.name + ': ' : '';
    try { return name + JSON.stringify(arg, (k, v) => (v === undefined ? '__undefined__' : v), 2).replace(/"__undefined__"/g, 'undefined'); }
    catch { return name + String(arg); }
  }
  return String(arg);
}

const log = (...args) => send({ line: args.map(show) });
const sandboxConsole = { log, info: log, debug: log, warn: log, error: log, clear: () => send({ clear: true }) };

(async () => {
  try {
    await new Function('console', 'return (async () => {' + ${safe(js)} + '\\n})()')(sandboxConsole);
  } catch (e) {
    send({ error: String(e) });
  }
  send({ done: true });
})();
<\/script>`;
}
