// Used by `ng serve` (angular.json: serve.options.proxyConfig). Sends `/__slide-ng/*`, WebSockets included,
// to the companion server that scripts/dev.mjs started (scripts/dev/server.mjs). `changeOrigin` stays off, so the
// companion sees the Host and Origin the browser really used and can check them.
const port = process.env.SLIDE_NG_DEV_PORT;

export default port
  ? { '/__slide-ng': { target: `http://127.0.0.1:${port}`, ws: true, changeOrigin: false, secure: false } }
  : {};
