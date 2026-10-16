// Web workers in an offline folder (`slide-ng build --offline`, used by the Monaco editor).
//
// Chromium refuses `new Worker('file:///...')` from a page that was opened from disk. A worker made from a Blob URL is
// allowed, and a classic script can hand us the worker's source text without a request. So each worker file is bundled
// as a classic script, written into `workers.js` as text, and the page's `Worker` is wrapped to start those texts.

const WORKER_NAME = /["'`](worker-[\w-]+\.js)["'`]/g;

/** The names of the worker files that a script refers to. */
export function workerFiles(script) {
  return [...new Set([...script.matchAll(WORKER_NAME)].map((m) => m[1]))];
}

/** Runs before the app: a `Worker` that starts the stored source of a worker file when there is one (only from file://). */
export const WORKER_SHIM = `(function () {
  var Native = window.Worker;
  window.__slideNgWorkers = window.__slideNgWorkers || {};
  window.Worker = function (url, options) {
    var name = /([^\\/]+)$/.exec(String(url));
    var source = location.protocol === 'file:' && name && window.__slideNgWorkers[name[1]];
    if (!source) return new Native(url, options);
    return new Native(URL.createObjectURL(new Blob([source], { type: 'text/javascript' })));
  };
  window.Worker.prototype = Native.prototype;
})();
`;

/** The text of `workers.js`: the bundled worker sources by file name. */
export const workersScript = (sources) =>
  `window.__slideNgWorkers = Object.assign(window.__slideNgWorkers || {}, ${JSON.stringify(sources)});\n`;
