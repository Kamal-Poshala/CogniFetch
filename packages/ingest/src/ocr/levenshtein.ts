/**
 * Levenshtein edit distance with a rolling row (O(n·m) time, O(min(n,m)) space).
 * Used by the OCR accuracy metrics.
 */
export function levenshtein(
  a: readonly unknown[] | string,
  b: readonly unknown[] | string,
): number {
  const s = typeof a === 'string' ? [...a] : a;
  const t = typeof b === 'string' ? [...b] : b;
  if (s.length === 0) return t.length;
  if (t.length === 0) return s.length;

  // Ensure `t` is the shorter sequence for the rolling row.
  const [long, short] = s.length >= t.length ? [s, t] : [t, s];

  let prev = new Array<number>(short.length + 1);
  let curr = new Array<number>(short.length + 1);
  for (let j = 0; j <= short.length; j++) prev[j] = j;

  for (let i = 1; i <= long.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= short.length; j++) {
      const cost = long[i - 1] === short[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[short.length]!;
}
