// Input transforms for values that arrive as text from a plain attribute (`scale="0.8"`).

/** A number, or undefined when the attribute is absent or empty. */
export const optionalNumber = (v: unknown): number | undefined => (v == null || v === '' ? undefined : Number(v));
