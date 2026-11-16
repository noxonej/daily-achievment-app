import { Mask, Px, ramp, type Pt } from '../../world/px/raster';

/**
 * The daily box as real pixel art (2026-11-16): a 3/4-view gift with a lid that lifts off, on a
 * small stone plinth. Same raster as the vehicles, so it shares Squzo's pixel look. 48×48 grid.
 */
export const GIFT = 48;

const BOX = '#3f5fd8';
const GOLD = '#e8b33a';
const OUTLINE = '#0b0c10';

function face(px: Px, pts: Pt[], col: (x: number, y: number, m: Mask) => string) {
  const m = new Mask(px.w, px.h);
  m.poly(pts);
  for (let y = 0; y < px.h; y++) for (let x = 0; x < px.w; x++) if (m.on(x, y)) px.set(x, y, col(x, y, m));
}

function paintBox(px: Px, base: string, ribbon: string, o: { x: number; y: number; w: number; h: number; dx: number; dy: number; top: boolean; bandX: number; bandW: number }) {
  const r = ramp(base);
  const g = ramp(ribbon);
  const { x, y, w, h, dx, dy, bandX, bandW } = o;
  // top face
  if (o.top) {
    face(px, [[x, y], [x + dx, y - dy], [x + w + dx, y - dy], [x + w, y]], (_px2, py) => (py === y - dy ? r[6] : r[5]));
    // ribbon across the top, running from the front band to the back
    for (let j = 0; j < dy; j++) for (let i = 0; i < bandW; i++) px.set(bandX + i + Math.round((j / dy) * dx), y - 1 - j, i === 0 ? g[6] : g[5]);
  }
  // front face with a soft vertical gradient
  face(px, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], (_px2, py) => {
    const t = (py - y) / h;
    return t < 0.15 ? r[4] : t < 0.55 ? r[3] : t < 0.85 ? r[2] : r[1];
  });
  // side face (in shade)
  face(px, [[x + w, y], [x + w + dx, y - dy], [x + w + dx, y + h - dy], [x + w, y + h]], (_px2, py) => (py > y + h * 0.6 ? r[0] : r[1]));
  // ribbon on the front
  for (let j = 0; j < h; j++) for (let i = 0; i < bandW; i++) px.set(bandX + i, y + j, i === 0 ? g[6] : i === bandW - 1 ? g[2] : j / h > 0.7 ? g[3] : g[4]);
  // ribbon round the side
  const sy = y + Math.floor(h / 2) - 1;
  for (let i = 0; i <= dx; i++) for (let j = 0; j < bandW - 1; j++) px.set(x + w + i, sy + j - Math.round((i / dx) * dy), j === 0 ? g[4] : g[2]);
  // a crisp highlight on the front-top edge
  for (let i = x; i < x + w; i++) if (i < bandX || i >= bandX + bandW) px.set(i, y, r[5]);
}

function bow(px: Px, cx: number, cy: number, ribbon: string) {
  const g = ramp(ribbon);
  // two loops, a knot and two tails
  const loop = (ox: number, flip: number) => {
    for (let j = -3; j <= 3; j++)
      for (let i = 0; i <= 6; i++) {
        const d = ((i - 3) / 3.4) ** 2 + (j / 3.2) ** 2;
        if (d <= 1) px.set(cx + ox + i * flip, cy - 3 + j, d < 0.18 ? g[1] : j < -1 ? g[6] : j < 1 ? g[4] : g[3]);
      }
  };
  loop(1, 1);
  loop(-1, -1);
  px.rect(cx - 1, cy - 5, 3, 4, g[4]);
  px.set(cx - 1, cy - 5, g[6]);
  px.set(cx - 2, cy - 1, g[3]);
  px.set(cx - 3, cy, g[2]);
  px.set(cx + 2, cy - 1, g[3]);
  px.set(cx + 3, cy, g[2]);
}

function plinth(px: Px) {
  const s = ramp('#5b6170');
  for (let y = 41; y < 47; y++) for (let x = 4; x < 44; x++) px.set(x, y, y === 41 ? s[6] : y === 42 ? s[5] : y < 45 ? s[3] : s[1]);
  for (let x = 6; x < 42; x += 9) px.set(x, 44, s[2]);
}

export function giftBase(opts: { locked?: boolean; open?: boolean } = {}): Px {
  const px = new Px(GIFT, GIFT);
  const base = opts.locked ? '#6b7280' : BOX;
  const ribbon = opts.locked ? '#c3c8d0' : GOLD;
  paintBox(px, base, ribbon, { x: 10, y: 22, w: 24, h: 19, dx: 6, dy: 5, top: true, bandX: 20, bandW: 4 });
  if (opts.open) {
    // dark inside, lit from within
    face(px, [[11, 22], [16, 18], [39, 18], [34, 22]], (_x, y) => (y === 18 ? '#fff6dc' : y === 19 ? '#ffe2a0' : '#f3c66b'));
  }
  px.outline(OUTLINE);
  return px;
}

export function giftLid(opts: { locked?: boolean } = {}): Px {
  const px = new Px(GIFT, GIFT);
  const base = opts.locked ? '#6b7280' : BOX;
  const ribbon = opts.locked ? '#c3c8d0' : GOLD;
  paintBox(px, base, ribbon, { x: 9, y: 17, w: 26, h: 6, dx: 6, dy: 5, top: true, bandX: 20, bandW: 4 });
  bow(px, 25, 13, ribbon);
  px.outline(OUTLINE);
  return px;
}

export function giftPlinth(): Px {
  const px = new Px(GIFT, GIFT);
  plinth(px);
  px.outline(OUTLINE);
  return px;
}

const urls = new Map<string, string>();
export function giftUrl(part: 'base' | 'lid' | 'plinth', opts: { locked?: boolean; open?: boolean } = {}): string {
  const key = `${part}|${opts.locked ? 1 : 0}|${opts.open ? 1 : 0}`;
  let u = urls.get(key);
  if (!u) {
    u = (part === 'base' ? giftBase(opts) : part === 'lid' ? giftLid(opts) : giftPlinth()).toDataURL();
    urls.set(key, u);
  }
  return u;
}
