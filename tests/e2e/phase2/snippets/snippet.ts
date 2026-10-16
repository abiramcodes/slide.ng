// A file used by `<<<` imports in the showcase deck.
export function add(a: number, b: number) {
  return a + b;
}

// #region greet
export function greet(name: string) {
  const who = name.trim();
  return `Hello, ${who}!`;
}
// #endregion greet

export const answer = { value: 42 };
