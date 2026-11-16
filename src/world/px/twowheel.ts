import { Mask, Px, ramp, type Pt } from './raster';
import { drawWheel } from './cars';

/**
 * Pixel-art bicycles, motorcycles and e-scooters (2026-11-16), drawn at exactly the same pixel
 * scale and light direction as the cars, so a scooter really is small next to a pickup.
 * Facing right. Points are [x, height above the ground].
 */

export const TW_W = 76;
export const TW_H = 50;
const GY = 46;
const OUTLINE = '#0b0c10';
const TRIM = '#16171c';
const CHROME = '#c9ced6';
const RUBBER = '#1b1c21';

export interface TwoWheelLook {
  paint: string;
  /** Second colour (seat stitching, accents). */
  accent?: string;
}

type Draw = (px: Px, look: TwoWheelLook) => void;

const P = (x: number, h: number): Pt => [x, GY - h];

/** Fill a shape with paint shading: lit top edge, darker underside. */
function panel(px: Px, pts: Pt[], base: string, opts: { gloss?: boolean } = {}) {
  const r = ramp(base);
  const m = new Mask(px.w, px.h);
  m.poly(pts.map(([x, h]) => P(x, h)));
  for (let x = 0; x < px.w; x++) {
    const top = m.top(x);
    if (top < 0) continue;
    const bot = m.bottom(x);
    for (let y = top; y <= bot; y++) {
      if (!m.on(x, y)) continue;
      const t = (y - top) / Math.max(1, bot - top);
      let i = y === top ? 6 : t < 0.3 ? 4 : t < 0.65 ? 3 : t < 0.9 ? 2 : 1;
      if (!m.on(x + 1, y) || !m.on(x - 1, y)) i = Math.max(0, i - 1);
      if (opts.gloss && y === top + 2 && m.on(x - 1, y) && m.on(x + 1, y)) i = 5;
      px.set(x, y, r[i]);
    }
  }
}

/** A tube two pixels thick: lit upper edge, shaded lower edge. */
function tube(px: Px, a: Pt, b: Pt, base: string, thick = 2) {
  const r = ramp(base);
  const [ax, ay] = P(a[0], a[1]);
  const [bx, by] = P(b[0], b[1]);
  const flat = Math.abs(bx - ax) >= Math.abs(by - ay);
  px.line(ax, ay, bx, by, r[5]);
  if (thick >= 2) {
    if (flat) px.line(ax, ay + 1, bx, by + 1, r[2]);
    else px.line(ax + 1, ay, bx + 1, by, r[2]);
  }
  if (thick >= 3) {
    if (flat) px.line(ax, ay + 2, bx, by + 2, r[1]);
    else px.line(ax + 2, ay, bx + 2, by, r[1]);
  }
}

/** Thin-tyred bicycle wheel with wire spokes (deep = carbon aero rim). */
function spokedWheel(px: Px, cx: number, r: number, opts: { rim?: string; deep?: boolean; spokes?: number; tyre?: number } = {}) {
  const cy = GY - r;
  const rimC = ramp(opts.rim ?? '#c9ced6');
  const tyre = opts.tyre ?? 1.6;
  const rimW = opts.deep ? 3.2 : 1.1;
  for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++)
    for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d = Math.hypot(dx, dy);
      const lit = -dx - dy > 0;
      if (d <= r && d > r - tyre) px.set(x, y, d > r - 0.7 ? '#111216' : lit ? '#2c2e35' : RUBBER);
      else if (d <= r - tyre && d > r - tyre - rimW) px.set(x, y, lit ? rimC[5] : rimC[2]);
    }
  if (opts.deep) {
    // decal on the deep rim
    for (let k = 0; k < 2; k++) {
      const a = -0.6 + k * Math.PI;
      px.set(Math.round(cx + Math.cos(a) * (r - tyre - 1.6)), Math.round(cy + Math.sin(a) * (r - tyre - 1.6)), '#f4f1ea');
    }
  }
  const n = opts.spokes ?? 14;
  const inner = r - tyre - rimW;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + 0.1;
    const ex = cx + Math.cos(a) * inner;
    const ey = cy + Math.sin(a) * inner;
    const hx = cx + Math.cos(a + 0.5) * 1.2;
    const hy = cy + Math.sin(a + 0.5) * 1.2;
    lineAlpha(px, hx, hy, ex, ey, '#8d939d', 0.75);
  }
  px.rect(Math.round(cx) - 1, Math.round(cy) - 1, 2, 2, '#7d838d');
  px.set(Math.round(cx) - 1, Math.round(cy) - 1, CHROME);
}

function lineAlpha(px: Px, x0: number, y0: number, x1: number, y1: number, c: string, a: number) {
  const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
  for (let i = 0; i <= n; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / n);
    const y = Math.round(y0 + ((y1 - y0) * i) / n);
    px.set(x, y, c, a);
  }
}

function motoWheel(px: Px, cx: number, r: number, style: string, rim = '#2a2c33', opts: { tyre?: number; knobby?: boolean; disc?: boolean } = {}) {
  const t = opts.tyre ?? 2.5;
  drawWheel(px, cx, GY - r, r, style, rim, { tyre: t });
  if (opts.knobby) {
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2;
      px.set(Math.round(cx + Math.cos(a) * (r + 0.6)), Math.round(GY - r + Math.sin(a) * (r + 0.6)), '#1b1c21');
    }
  }
  if (opts.disc !== false) {
    // brake disc ring just inside the rim
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      const rr = (r - t) * 0.62;
      if (k % 2 === 0) px.set(Math.round(cx + Math.cos(a) * rr), Math.round(GY - r + Math.sin(a) * rr), '#9aa0aa');
    }
  }
}

function seat(px: Px, pts: Pt[], col = '#26201d') {
  const r = ramp(col);
  const m = new Mask(px.w, px.h);
  m.poly(pts.map(([x, h]) => P(x, h)));
  for (let y = 0; y < px.h; y++)
    for (let x = 0; x < px.w; x++) if (m.on(x, y)) px.set(x, y, !m.on(x, y - 1) ? r[5] : !m.on(x, y + 1) ? r[1] : r[3]);
}

function headlight(px: Px, x: number, h: number, round = true) {
  const [cx, cy] = P(x, h);
  if (round) {
    px.disc(cx, cy, 2.2, '#2a2c33');
    px.disc(cx + 0.5, cy, 1.5, '#f3efe0');
    px.set(cx, cy - 1, '#ffffff');
  } else {
    px.rect(cx - 1, cy - 1, 3, 2, '#f3efe0');
    px.set(cx - 1, cy - 1, '#ffffff');
  }
}

/** Motorcycle engine: crankcase, finned cylinder, cover, radiator in front. */
function motoEngine(px: Px, x0: number, x1: number, aircooled = false, lift = 0) {
  const h = (v: number) => v + lift;
  panel(px, [[x0, h(6)], [x0 - 1, h(12)], [x0 + 3, h(15)], [x1 - 2, h(15)], [x1, h(11)], [x1 - 2, h(5)], [x0 + 2, h(4)]], '#4a4e58');
  // cylinder leaning forward
  panel(px, [[x0 + 5, h(14)], [x0 + 6, h(21)], [x1 - 4, h(22)], [x1 - 2, h(14)]], aircooled ? '#9aa0aa' : '#3b3e46');
  if (aircooled) for (let v = 15; v < 22; v += 2) tube(px, [x0 + 6, h(v)], [x1 - 3, h(v)], '#5d616b', 1);
  // clutch cover
  px.disc(...P(x0 + 6, h(9)), 3, '#7d838d');
  px.disc(...P(x0 + 6, h(9)), 2, '#a7adb7');
  px.set(P(x0 + 5, h(10))[0], P(x0 + 5, h(10))[1], '#e2e6ec');
  if (!aircooled) {
    // radiator
    px.rect(...P(x1 - 1, h(22)), 3, 10, '#202228');
    for (let v = 13; v < 22; v += 2) px.rect(...P(x1 - 1, h(v)), 3, 1, '#3b3e46');
  }
}

/** Header pipe and a silencer. */
function exhaust(px: Px, from: Pt, via: Pt, end: Pt, megaphone = false, fishtail = false) {
  tube(px, from, via, CHROME, 2);
  tube(px, via, end, CHROME, 2);
  const [ex, ey] = P(end[0], end[1]);
  if (megaphone) {
    px.poly([[ex - 1, ey - 2], [ex + 8, ey - 1], [ex + 8, ey + 2], [ex - 1, ey + 3]], '#b9bfc8');
    px.rect(ex - 1, ey - 2, 9, 1, '#eef1f5');
  } else if (fishtail) {
    px.rect(ex - 2, ey - 1, 3, 3, '#b9bfc8');
  } else {
    px.rect(ex - 1, ey - 2, 9, 4, '#3b3e46');
    px.rect(ex - 1, ey - 2, 9, 1, '#6b707b');
    px.rect(ex - 2, ey - 1, 1, 2, CHROME);
  }
}

/* ------------------------------------------------------------------ models */

export const TWO_WHEELERS: Record<string, Draw> = {
  /** Dutch-style city bike: step-through frame, basket, fenders, rack. */
  citybike(px, { paint }) {
    spokedWheel(px, 20, 8.5);
    spokedWheel(px, 50, 8.5);
    const bb: Pt = [33, 8];
    tube(px, bb, [26, 22], paint); // seat tube
    tube(px, [21, 8.5], bb, paint); // chain stay
    tube(px, [21, 8.5], [27, 20], paint); // seat stay
    tube(px, bb, [44, 20], paint, 3); // low step-through down tube
    tube(px, [44, 18], [46, 25], paint); // head tube
    tube(px, [46, 22], [50, 8.5], '#c9ced6'); // fork
    // fenders
    for (const cx of [20, 50]) for (let k = 0; k < 14; k++) {
      const a = Math.PI + 0.25 + (k / 13) * (Math.PI - 0.5);
      px.set(Math.round(cx + Math.cos(a) * 10), Math.round(GY - 8.5 + Math.sin(a) * 10), ramp(paint)[2]);
    }
    // rack + basket
    tube(px, [13, 19], [24, 19], '#3b3e46');
    px.rect(...P(46, 28), 9, 6, '#a0723f');
    for (let i = 0; i < 9; i += 2) px.rect(P(46, 28)[0] + i, P(46, 28)[1], 1, 6, '#7a5330');
    px.rect(...P(46, 28), 9, 1, '#c99a5c');
    // seat, bars
    seat(px, [[22, 25], [30, 25], [29, 23], [23, 23]], '#5a3a26');
    tube(px, [46, 25], [47, 29], '#3b3e46');
    tube(px, [42, 30], [48, 29], '#3b3e46');
    headlight(px, 51, 22);
    px.disc(...P(33, 8), 2.4, '#3b3e46');
  },
  /** Carbon road racer: drop bars, deep-section rims. */
  racebike(px, { paint }) {
    spokedWheel(px, 20, 8.5, { deep: true, rim: '#202228', spokes: 10 });
    spokedWheel(px, 51, 8.5, { deep: true, rim: '#202228', spokes: 10 });
    const bb: Pt = [34, 8.5];
    tube(px, bb, [28, 25], paint);
    tube(px, [20, 8.5], bb, paint);
    tube(px, [20, 8.5], [29, 23], paint);
    tube(px, [29, 24], [45, 25.5], paint);
    tube(px, bb, [45, 23], paint, 3);
    tube(px, [45, 22], [46, 27], paint);
    tube(px, [46, 23], [51, 8.5], '#202228');
    seat(px, [[23, 28], [32, 28], [31, 26.5], [24, 26.5]]);
    tube(px, [28, 25], [27, 27], '#202228');
    // stem and drop bar
    tube(px, [46, 27], [50, 28], '#202228');
    const [dx, dy] = P(50, 28);
    px.line(dx, dy, dx + 2, dy + 1, '#202228');
    px.line(dx + 2, dy + 1, dx + 2, dy + 4, '#202228');
    px.line(dx + 2, dy + 4, dx, dy + 5, '#202228');
    px.disc(...P(34, 8.5), 2.2, '#9aa0aa');
    // a white accent on the down tube
    tube(px, [38, 14], [41, 18], '#f4f1ea', 1);
  },
  /** Commuter kick e-scooter: low deck, tall stem, small wheels. */
  escooter(px, { paint }) {
    motoWheel(px, 16, 4.5, 'aero', '#2a2c33', { tyre: 1.6, disc: false });
    motoWheel(px, 44, 4.5, 'aero', '#2a2c33', { tyre: 1.6, disc: false });
    panel(px, [[14, 7], [16, 9], [40, 9], [41, 7], [38, 5], [18, 5]], paint, { gloss: true });
    px.rect(...P(19, 9.5), 18, 1, '#26282f'); // grip tape
    tube(px, [41, 7], [44, 4.5], paint);
    tube(px, [41, 8], [47, 33], paint, 3); // stem
    tube(px, [43, 33], [51, 34], '#26282f');
    px.rect(...P(43, 34), 2, 2, '#16171c');
    px.rect(...P(50, 35), 2, 2, '#16171c');
    headlight(px, 46, 28, false);
    // rear fender + brake light
    tube(px, [11, 8], [17, 9], paint);
    px.rect(...P(11, 8), 2, 1, '#e11d48');
    // LED strip under the deck
    for (let x = 20; x < 37; x++) px.set(x, GY - 5 + 1, '#22d3ee', 0.8);
  },
  /** Dual-motor performance scooter: chunky tyres, suspension, wide deck, light bar. */
  escooterpro(px, { paint }) {
    motoWheel(px, 15, 6, 'rays', '#2a2c33', { tyre: 2.4 });
    motoWheel(px, 47, 6, 'rays', '#2a2c33', { tyre: 2.4 });
    panel(px, [[12, 10], [15, 12.5], [42, 12.5], [44, 10], [41, 7], [16, 7]], paint, { gloss: true });
    px.rect(...P(17, 13), 22, 1, '#26282f');
    // swing arms + springs
    tube(px, [15, 6], [20, 9], '#3b3e46');
    tube(px, [42, 10], [47, 6], '#3b3e46');
    for (let i = 0; i < 4; i++) px.set(P(19 + i, 8)[0], P(19 + i, 8)[1] - (i % 2), '#e5b80b');
    // dual stem
    tube(px, [43, 11], [49, 35], paint, 3);
    tube(px, [45, 11], [51, 35], ramp(paint)[1]);
    tube(px, [44, 35], [55, 36], '#26282f');
    px.rect(...P(44, 36), 3, 2, '#16171c');
    px.rect(...P(53, 37), 3, 2, '#16171c');
    // display + light bar
    px.rect(...P(48, 34), 3, 2, '#22d3ee');
    headlight(px, 49, 28, false);
    headlight(px, 50, 22, false);
    // rear light and fender
    tube(px, [8, 12], [16, 13], paint);
    px.rect(...P(8, 12), 3, 2, '#e11d48');
  },
  /** Naked street bike: round light, big exposed engine, short tail. */
  naked(px, { paint }) {
    motoWheel(px, 15, 8.5, 'rays');
    motoWheel(px, 57, 8.5, 'rays');
    tube(px, [15, 8.5], [30, 13], '#2a2c33', 3); // swingarm
    motoEngine(px, 26, 44);
    exhaust(px, [32, 7], [17, 10], [9, 16]);
    // trellis frame over the engine
    tube(px, [28, 17], [48, 30], '#e5b80b', 2);
    tube(px, [30, 12], [44, 24], '#e5b80b', 1);
    // tank, seat, tail
    panel(px, [[30, 22], [32, 28], [38, 31], [46, 30.5], [49, 27], [46, 21], [33, 20]], paint, { gloss: true });
    seat(px, [[15, 26], [31, 25], [32, 22], [17, 22.5]]);
    panel(px, [[7, 29], [16, 27], [17, 23], [10, 24]], paint, { gloss: true });
    px.rect(...P(7, 28), 2, 1, '#e11d48');
    // fork, bars, light, fender
    tube(px, [49, 30], [57, 8.5], '#c9ced6', 3);
    tube(px, [45, 33], [52, 32], '#2a2c33');
    headlight(px, 53, 27);
    panel(px, [[52, 18.5], [57, 19.5], [62, 17], [61, 15.5], [53, 16.5]], paint);
  },
  /** Café racer: long tank, humped seat, clip-ons, wire wheels, megaphone pipe. */
  cafe(px, { paint }) {
    motoWheel(px, 15, 8.5, 'wire', '#c9ced6', { tyre: 2 });
    motoWheel(px, 57, 8.5, 'wire', '#c9ced6', { tyre: 2 });
    tube(px, [15, 8.5], [30, 13], '#2a2c33', 2);
    motoEngine(px, 27, 43, true);
    exhaust(px, [31, 7], [16, 11], [7, 15], true);
    tube(px, [28, 18], [48, 29], '#202228', 2);
    panel(px, [[28, 22], [30, 28], [36, 31], [46, 30.5], [50, 27], [47, 22]], paint, { gloss: true });
    tube(px, [33, 26], [45, 26.5], '#f4f1ea', 1);
    seat(px, [[15, 25.5], [27, 24], [28, 22], [16, 22]], '#3d2a20');
    panel(px, [[8, 30], [15, 27], [16, 22], [10, 23]], paint, { gloss: true });
    px.rect(...P(7, 25), 2, 1, '#e11d48');
    tube(px, [50, 29], [57, 8.5], '#c9ced6', 2);
    tube(px, [47, 28], [53, 27], '#2a2c33');
    headlight(px, 54, 24);
    panel(px, [[52, 18], [57, 18.5], [61, 16], [53, 16]], '#c9ced6');
  },
  /** Fully faired sport bike: windscreen, high tail, tucked bars. */
  sport(px, { paint }) {
    motoWheel(px, 15, 8.5, 'split', '#2a2c33');
    motoWheel(px, 57, 8.5, 'split', '#2a2c33');
    tube(px, [15, 8.5], [31, 12], '#2a2c33', 3);
    // fairing covering the engine
    panel(px, [[28, 9], [26, 15], [30, 22], [44, 27], [53, 28], [58, 24], [56, 19], [50, 14], [44, 9]], paint, { gloss: true });
    // belly pan + side vent
    px.rect(...P(33, 12), 6, 1, '#16171c');
    px.rect(...P(34, 14), 5, 1, '#16171c');
    // screen
    for (let i = 0; i < 6; i++) px.set(P(52 + i, 28 + i * 0.3)[0], P(52 + i, 28 + i * 0.3)[1], '#5d708c');
    px.poly([P(50, 29), P(55, 31.5), P(57, 29)], '#2f3a4c');
    // tank + tail (up high)
    panel(px, [[32, 23], [36, 28], [44, 28], [44, 25]], ramp(paint)[2]);
    seat(px, [[20, 26.5], [32, 25.5], [32, 24], [21, 24]]);
    panel(px, [[6, 30], [20, 27.5], [21, 23], [10, 25]], paint, { gloss: true });
    px.rect(...P(6, 29), 3, 1, '#e11d48');
    // undertail exhaust
    px.rect(...P(10, 23), 7, 2, '#3b3e46');
    tube(px, [53, 24], [57, 8.5], '#d4a63a', 2); // gold forks
    px.rect(...P(56, 22), 3, 2, '#f3efe0'); // twin lights
    px.set(P(56, 22)[0], P(56, 22)[1], '#ffffff');
    panel(px, [[52, 18], [57, 18.5], [61, 16], [53, 16]], paint);
  },
  /** Adventure / dirt: tall, long-travel forks, knobby tyres, high fender, number board. */
  adventure(px, { paint }) {
    motoWheel(px, 14, 9.5, 'wire', '#2a2c33', { tyre: 3, knobby: true });
    motoWheel(px, 58, 10, 'wire', '#2a2c33', { tyre: 3, knobby: true });
    tube(px, [14, 9.5], [31, 16], '#3b3e46', 3);
    motoEngine(px, 27, 43, false, 6);
    tube(px, [29, 20], [48, 33], '#2a2c33', 2);
    exhaust(px, [31, 14], [20, 22], [11, 25]);
    panel(px, [[30, 25], [33, 32], [46, 34], [51, 31], [46, 24], [34, 22]], paint, { gloss: true });
    panel(px, [[50, 31], [55, 35], [58, 28], [53, 25.5]], '#f4f1ea');
    px.rect(...P(54, 32), 2, 4, '#16171c');
    seat(px, [[13, 31], [32, 31], [33, 28.5], [14, 28.5]]);
    panel(px, [[5, 33], [14, 31.5], [15, 28], [9, 28.5]], paint, { gloss: true });
    px.rect(...P(5, 32), 2, 1, '#e11d48');
    tube(px, [51, 33], [58, 10], '#d4a63a', 3);
    tube(px, [46, 37], [55, 36], '#2a2c33');
    px.rect(...P(54, 37.5), 3, 2, paint);
    panel(px, [[53, 25], [58, 26], [65, 24], [59, 22.5]], paint);
  },
  /** Cruiser chopper: raked fork, fat rear tyre, ape bars, teardrop tank, chrome V-twin. */
  cruiser(px, { paint }) {
    motoWheel(px, 14, 9.5, 'turbine', '#c9ced6', { tyre: 3.5 });
    motoWheel(px, 63, 8, 'wire', '#c9ced6', { tyre: 2 });
    tube(px, [14, 9.5], [29, 9], '#c9ced6', 2);
    // V-twin with two chrome cylinders
    panel(px, [[25, 5], [24, 12], [40, 13], [42, 6], [38, 4], [28, 4]], '#5b606b');
    panel(px, [[27, 12], [29, 21], [34, 21], [34, 12]], '#c9ced6');
    panel(px, [[35, 12], [38, 21], [43, 21], [41, 12]], '#c9ced6');
    for (let h = 13; h < 21; h += 2) {
      tube(px, [27, h], [34, h], '#7d838d', 1);
      tube(px, [35, h], [42, h], '#7d838d', 1);
    }
    exhaust(px, [30, 8], [16, 10], [4, 11], false, true);
    exhaust(px, [37, 10], [18, 13], [4, 14], false, true);
    tube(px, [22, 22], [47, 27], '#202228', 2);
    panel(px, [[31, 23], [34, 29], [43, 30.5], [48, 28], [45, 23]], paint, { gloss: true });
    tube(px, [36, 26], [44, 27.5], '#ff9a3c', 1);
    tube(px, [38, 25], [44, 26], '#ffd23f', 1);
    seat(px, [[15, 24], [31, 22.5], [31, 20], [17, 19.5]], '#2b2220');
    panel(px, [[7, 21], [16, 22.5], [16, 18], [9, 17]], paint);
    px.rect(...P(7, 20), 2, 1, '#e11d48');
    tube(px, [47, 28], [63, 8], '#c9ced6', 2);
    tube(px, [48, 28], [47, 38], '#c9ced6');
    tube(px, [44, 38], [49, 38], '#c9ced6');
    headlight(px, 52, 25);
  },
};

export function drawTwoWheeler(model: string, look: TwoWheelLook): Px {
  const px = new Px(TW_W, TW_H);
  (TWO_WHEELERS[model] ?? TWO_WHEELERS.citybike)(px, look);
  px.outline(OUTLINE);
  // shadow
  let a = TW_W;
  let b = 0;
  for (let x = 0; x < TW_W; x++) if (px.has(x, GY - 1)) {
    a = Math.min(a, x);
    b = Math.max(b, x);
  }
  for (let x = a - 3; x <= b + 3; x++) if (!px.has(x, GY + 1)) px.set(x, GY + 1, '#000000', x < a || x > b ? 0.12 : 0.28);
  void TRIM;
  return px;
}
