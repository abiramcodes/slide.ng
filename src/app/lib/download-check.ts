// Whether the page can ask the server about a `download` target. A file in the build (`deck.pdf`) or a path on this site
// (`/files/deck.pdf`) can be checked; a full address, or `//host/...`, belongs to somebody else and is taken as it is.
export function canCheckTarget(target: string): boolean {
  return !/^(https?:)?\/\//.test(target);
}
