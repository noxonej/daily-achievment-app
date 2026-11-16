/** Colour helpers for the room art. */
export function mix(a: string, b: string, t: number): string {
  const pa = parse(a);
  const pb = parse(b);
  const m = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${m.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function parse(hex: string): number[] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) || 0);
}

/** Darker (f 0–1). */
export const shade = (hex: string, f: number) => mix(hex, '#000000', f);
/** Lighter (f 0–1). */
export const tint = (hex: string, f: number) => mix(hex, '#ffffff', f);

/** Perceived brightness 0–1. */
export function luma(hex: string): number {
  const [r, g, b] = parse(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
