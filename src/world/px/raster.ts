/**
 * Tiny pixel raster used by every Squzo vehicle sprite (2026-11-16 pixel-art rebuild).
 * Everything is drawn on a small grid (one cell = one art pixel) and shown scaled up with
 * `image-rendering: pixelated`, so all vehicles share one pixel size and one light direction
 * (light from the top left, shadows hue-shift towards blue, highlights towards warm).
 */

export type RGB = [number, number, number];

const cache = new Map<string, RGB>();
export function rgb(hex: string): RGB {
  let c = cache.get(hex);
  if (!c) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.replace(/./g, (m) => m + m) : h.slice(0, 6), 16);
    c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    cache.set(hex, c);
  }
  return c;
}

export function toHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
}

const rampCache = new Map<string, string[]>();
/**
 * Seven shades of one colour, darkest first (index 3 = the colour itself).
 * Shadows sink towards deep indigo (cool), highlights lift towards warm white, the classic
 * pixel-art "hue shift" that keeps shading rich instead of muddy grey.
 */
export function ramp(hex: string): string[] {
  const hit = rampCache.get(hex);
  if (hit) return hit;
  const l = luma(hex);
  const steps = [-0.62, -0.42, -0.22, 0, 0.16, 0.34, 0.55];
  const out = steps.map((k) => {
    if (k === 0) return hex;
    if (k < 0) return mixHex(hex, '#0c0a24', Math.min(0.85, -k * (l < 0.2 ? 0.55 : 1)));
    // Light paint can't get much lighter: lift it less so it doesn't turn into flat white.
    return mixHex(hex, '#fff6e6', Math.min(0.9, k * (l > 0.75 ? 0.55 : 1)));
  });
  rampCache.set(hex, out);
  return out;
}

export function mixHex(a: string, b: string, t: number): string {
  const x = rgb(a);
  const y = rgb(b);
  return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}

/** Perceived brightness 0–1. */
export function luma(hex: string): number {
  const [r, g, b] = rgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export type Pt = [number, number];

/** A small RGBA pixel buffer with the drawing tools the sprites need. */
export class Px {
  readonly w: number;
  readonly h: number;
  readonly d: Uint8ClampedArray;
  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.d = new Uint8ClampedArray(w * h * 4);
  }
  inside(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }
  set(x: number, y: number, c: string, a = 1) {
    x = Math.round(x);
    y = Math.round(y);
    if (!this.inside(x, y)) return;
    const i = (y * this.w + x) * 4;
    const [r, g, b] = rgb(c);
    if (a >= 1 || this.d[i + 3] === 0) {
      this.d[i] = r;
      this.d[i + 1] = g;
      this.d[i + 2] = b;
      this.d[i + 3] = Math.max(this.d[i + 3], Math.round(a * 255));
      return;
    }
    this.d[i] = this.d[i] + (r - this.d[i]) * a;
    this.d[i + 1] = this.d[i + 1] + (g - this.d[i + 1]) * a;
    this.d[i + 2] = this.d[i + 2] + (b - this.d[i + 2]) * a;
  }
  /** Only paints where something is already drawn. */
  over(x: number, y: number, c: string, a = 1) {
    if (this.has(x, y)) this.set(x, y, c, a);
  }
  has(x: number, y: number) {
    x = Math.round(x);
    y = Math.round(y);
    return this.inside(x, y) && this.d[(y * this.w + x) * 4 + 3] > 0;
  }
  hex(x: number, y: number): string | null {
    if (!this.has(x, y)) return null;
    const i = (Math.round(y) * this.w + Math.round(x)) * 4;
    return toHex([this.d[i], this.d[i + 1], this.d[i + 2]]);
  }
  clear(x: number, y: number) {
    if (!this.inside(x, y)) return;
    this.d[(y * this.w + x) * 4 + 3] = 0;
  }
  rect(x: number, y: number, w: number, h: number, c: string, a = 1) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c, a);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: string, thick = 1) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (thick > 1) {
        // Thicken across the main direction.
        if (dx >= -dy) for (let t = 1; t < thick; t++) this.set(x0, y0 + t, c);
        else for (let t = 1; t < thick; t++) this.set(x0 + t, y0, c);
      }
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }
  disc(cx: number, cy: number, r: number, c: string) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.set(x, y, c);
  }
  poly(pts: Pt[], c: string) {
    fillPoly(pts, (x, y) => this.set(x, y, c));
  }
  /** Outline every empty pixel that touches a drawn one (classic sprite outline). */
  outline(c: string, diagonal = false) {
    const solid = new Uint8Array(this.w * this.h);
    for (let i = 0; i < this.w * this.h; i++) solid[i] = this.d[i * 4 + 3] > 40 ? 1 : 0;
    const at = (x: number, y: number) => x >= 0 && y >= 0 && x < this.w && y < this.h && solid[y * this.w + x] === 1;
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (at(x, y)) continue;
        if (at(x + 1, y) || at(x - 1, y) || at(x, y + 1) || at(x, y - 1) || (diagonal && (at(x + 1, y + 1) || at(x - 1, y - 1) || at(x + 1, y - 1) || at(x - 1, y + 1)))) {
          const i = (y * this.w + x) * 4;
          const [r, g, b] = rgb(c);
          this.d[i] = r;
          this.d[i + 1] = g;
          this.d[i + 2] = b;
          this.d[i + 3] = 255;
        }
      }
  }
  /** Paste another buffer on top. */
  stamp(src: Px, ox: number, oy: number) {
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        const i = (y * src.w + x) * 4;
        if (src.d[i + 3] === 0) continue;
        const tx = x + ox;
        const ty = y + oy;
        if (!this.inside(tx, ty)) continue;
        const j = (ty * this.w + tx) * 4;
        const a = src.d[i + 3] / 255;
        this.d[j] = this.d[j] * (1 - a) + src.d[i] * a;
        this.d[j + 1] = this.d[j + 1] * (1 - a) + src.d[i + 1] * a;
        this.d[j + 2] = this.d[j + 2] * (1 - a) + src.d[i + 2] * a;
        this.d[j + 3] = Math.max(this.d[j + 3], src.d[i + 3]);
      }
  }
  toDataURL(): string {
    if (typeof document === 'undefined') return '';
    const c = document.createElement('canvas');
    c.width = this.w;
    c.height = this.h;
    const ctx = c.getContext('2d');
    if (!ctx) return '';
    const img = ctx.createImageData(this.w, this.h);
    img.data.set(this.d);
    ctx.putImageData(img, 0, 0);
    return c.toDataURL('image/png');
  }
}

/** Scanline polygon fill on pixel centres. */
export function fillPoly(pts: Pt[], plot: (x: number, y: number) => void) {
  if (pts.length < 3) return;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, y] of pts) {
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    const cy = y + 0.5;
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % pts.length];
      if ((y0 <= cy && y1 > cy) || (y1 <= cy && y0 > cy)) xs.push(x0 + ((cy - y0) / (y1 - y0)) * (x1 - x0));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) plot(x, y);
    }
  }
}

/** A boolean mask the same size as a buffer. */
export class Mask {
  readonly w: number;
  readonly h: number;
  readonly m: Uint8Array;
  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.m = new Uint8Array(w * h);
  }
  on(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h && this.m[y * this.w + x] === 1;
  }
  put(x: number, y: number, v = 1) {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.m[y * this.w + x] = v;
  }
  poly(pts: Pt[], v = 1) {
    fillPoly(pts, (x, y) => this.put(x, y, v));
  }
  disc(cx: number, cy: number, r: number, v = 1) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.put(x, y, v);
  }
  /** Topmost / bottom-most set pixel in a column (or -1). */
  top(x: number): number {
    for (let y = 0; y < this.h; y++) if (this.on(x, y)) return y;
    return -1;
  }
  bottom(x: number): number {
    for (let y = this.h - 1; y >= 0; y--) if (this.on(x, y)) return y;
    return -1;
  }
  edge(x: number, y: number) {
    return this.on(x, y) && (!this.on(x + 1, y) || !this.on(x - 1, y) || !this.on(x, y + 1) || !this.on(x, y - 1));
  }
}
