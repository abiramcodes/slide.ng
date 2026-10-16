/**
 * Every page opened from disk (file://) shares one localStorage and one set of BroadcastChannels with every other page opened
 * from disk, whatever folder it is in. A web address has its own origin per host, so only file:// needs this: a suffix with the
 * deck's folder, so two offline decks do not share drawings or follow each other's slides. Empty for a web address.
 */
export function diskScope(loc: Pick<Location, 'protocol' | 'pathname'> = location): string {
  if (loc.protocol !== 'file:') return '';
  return `@${loc.pathname.slice(0, loc.pathname.lastIndexOf('/') + 1)}`;
}
