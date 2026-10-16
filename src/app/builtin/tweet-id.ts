/** The id of a post, from an `id` or from a twitter.com / x.com address. undefined when there is none. */
export function resolveTweetId(id?: string | number, url?: string): string | undefined {
  if (id != null && String(id).trim()) return String(id).trim();
  return url?.match(/(?:twitter|x)\.com\/[^/]+\/status\/(\d+)/)?.[1];
}
