// Deterministic string hash (djb2-ish via Math.imul), shared by anything that
// needs reproducible "randomness" — the same input always gives the same
// output, so features built on it never need to persist their outcome.
export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
