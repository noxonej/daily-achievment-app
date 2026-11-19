

/* ---------- colour helpers ---------- */
export function shade(hex: string, amount: number): string {
  // amount < 0 darkens, > 0 lightens (-1..1)
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const f = (c: number) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
  return `#${[f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Blend two hex colours (t = 0 → a, 1 → b). */
export function mix(a: string, b: string, t: number): string {
  const p = (h: string) => parseInt(h.replace('#', ''), 16);
  const [x, y] = [p(a), p(b)];
  const c = (sh: number) => Math.round(((x >> sh) & 255) * (1 - t) + ((y >> sh) & 255) * t);
  return `#${[c(16), c(8), c(0)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function star(cx: number, cy: number, outer: number, inner: number, points = 5): string {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    d += `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  }
  return d + 'Z';
}

export type Ctx = {
  id: string;
  skin: string;
  skinDark: string;
  hair: string;
  hairDark: string;
  /** Iris colours: centre, mid, rim. */
  eye: [string, string, string];
  brow: string;
  lip: string;
  lipDark: string;
};
