// What `slide-ng --remote` prints, as lines of text (pure, so a test can read them). Like Slidev's start-up message:
// the public show, the private one (with the password in the address), the presenter and the addresses on the network.
// Remote mode without a password works, as in Slidev, but it says so: anyone who can reach the port can use it.

/** @param {{ port: number, password: string, addresses: string[], routerMode?: string }} info */
export function remoteLines({ port, password, addresses, routerMode }) {
  const slash = routerMode === 'hash' ? '/#/' : '/';
  const query = password ? `?password=${encodeURIComponent(password)}` : '';
  const lines = [''];
  lines.push('[slide.ng] remote access is ON');
  for (const host of addresses.length ? addresses : ['<your address>']) {
    const base = `http://${host}:${port}`;
    lines.push(`[slide.ng]   public slide show:  ${base}${slash}`);
    if (password) lines.push(`[slide.ng]   private slide show: ${base}${slash}${query}`);
    lines.push(`[slide.ng]   presenter mode:     ${base}${slash}presenter/1${query}`);
  }
  if (password) lines.push('[slide.ng] the password is needed to follow the presenter and to use the dev server from another device');
  else lines.push('[slide.ng] WARNING: no password. Anyone who can reach this port can open the deck and follow or move the presenter. Use --remote=<password> on a network you do not trust.');
  lines.push('[slide.ng] there is no HTTPS; the password and the slides cross the network in the clear');
  lines.push('');
  return lines;
}
