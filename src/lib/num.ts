import { locale } from './locale';

/**
 * Numbers for small tiles and bubbles: thousands separators up to 99,999, then a short form
 * (483.4K, 1.2M) so a big count never spills out of its box.
 */
export function shortNum(n: number): string {
  const v = Math.round(n);
  const abs = Math.abs(v);
  if (abs < 100_000) return v.toLocaleString(locale());
  const units: Array<[number, string]> = [
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ];
  for (const [size, suffix] of units) {
    if (abs >= size) {
      const x = v / size;
      const digits = Math.abs(x) >= 100 ? 0 : 1;
      return `${Number(x.toFixed(digits)).toLocaleString(locale())}${suffix}`;
    }
  }
  return String(v);
}
