import { Px, mixHex, ramp } from './raster';

/**
 * Pixel-art garage places (2026-11-16). Same pixel size as the vehicles and the character, so the
 * whole scene reads as one picture. 192×108 art pixels; the floor line is at y = FLOOR.
 */
export const SCENE_W = 192;
export const SCENE_H = 108;
export const FLOOR = 94;

type Env = (px: Px, t: Set<string>) => void;

function vgrad(px: Px, y0: number, y1: number, top: string, bottom: string, x0 = 0, x1 = SCENE_W) {
  for (let y = y0; y < y1; y++) {
    const k = (y - y0) / Math.max(1, y1 - y0 - 1);
    // 4-step bands instead of a smooth gradient: pixel-art style.
    const c = mixHex(top, bottom, Math.round(k * 4) / 4);
    for (let x = x0; x < x1; x++) px.set(x, y, c);
  }
}

function dither(px: Px, x0: number, y0: number, w: number, h: number, c: string, a = 0.5) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if ((x + y) % 2 === 0) px.set(x, y, c, a);
}

/** A soft cone of light from (x, y0) down to the floor. */
function cone(px: Px, x: number, y0: number, spread: number, c: string, a = 0.16) {
  for (let y = y0; y < SCENE_H; y++) {
    const w = ((y - y0) / (SCENE_H - y0)) * spread;
    for (let i = -Math.round(w); i <= Math.round(w); i++) {
      const edge = Math.abs(i) > w - 2;
      if (edge && (i + y) % 2) continue;
      px.set(x + i, y, c, a * (edge ? 0.5 : 1));
    }
  }
}

function floorTiles(px: Px, base: string, line: string) {
  const r = ramp(base);
  for (let y = FLOOR; y < SCENE_H; y++) for (let x = 0; x < SCENE_W; x++) px.set(x, y, y === FLOOR ? r[5] : y < FLOOR + 3 ? r[4] : r[3]);
  // perspective seams
  for (let k = -6; k <= 6; k++) {
    const xb = SCENE_W / 2 + k * 34;
    for (let y = FLOOR + 1; y < SCENE_H; y++) {
      const x = Math.round(SCENE_W / 2 + (xb - SCENE_W / 2) * (0.55 + ((y - FLOOR) / (SCENE_H - FLOOR)) * 0.45));
      px.set(x, y, line, 0.6);
    }
  }
  for (const y of [FLOOR + 5, FLOOR + 11]) for (let x = 0; x < SCENE_W; x++) px.set(x, y, line, 0.45);
}

/* ------------------------------------------------------------------ props */

function toolbox(px: Px, x: number, y: number) {
  const r = ramp('#c0392b');
  px.rect(x, y, 18, 14, r[3]);
  px.rect(x, y, 18, 1, r[5]);
  for (let j = 3; j < 14; j += 4) {
    px.rect(x + 1, y + j, 16, 1, r[1]);
    px.rect(x + 7, y + j - 2, 4, 1, '#d9dde3');
  }
  px.rect(x + 1, y + 14, 2, 1, '#16171c');
  px.rect(x + 15, y + 14, 2, 1, '#16171c');
}

function tyreStack(px: Px, x: number, n = 3) {
  for (let i = 0; i < n; i++) {
    const y = FLOOR - 5 - i * 5;
    px.rect(x, y, 14, 5, '#1b1c21');
    px.rect(x, y, 14, 1, '#34363e');
    px.rect(x + 2, y + 2, 10, 1, '#2a2c33');
  }
}

function flag(px: Px, x: number, y: number) {
  px.rect(x, y, 1, 20, '#8d939d');
  for (let j = 0; j < 8; j++) for (let i = 0; i < 12; i++) px.set(x + 1 + i, y + j + Math.round(Math.sin(i * 0.5) * 0.6), ((i >> 1) + (j >> 1)) % 2 ? '#f4f1ea' : '#16171c');
}

function banner(px: Px, x: number, y: number) {
  const r = ramp('#1f4fa8');
  px.rect(x, y, 22, 12, r[3]);
  px.rect(x, y, 22, 1, r[5]);
  px.poly([[x, y + 12], [x + 11, y + 17], [x + 22, y + 12]], r[2]);
  // a pixel star
  const c = '#f0c24a';
  [[11, 4], [10, 5], [11, 5], [12, 5], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [10, 7], [12, 7], [11, 8]].forEach(([i, j]) => px.set(x + i, y + j, c));
}

function lightSign(px: Px, x: number, y: number) {
  px.rect(x - 2, y - 2, 18, 15, '#101116');
  // a pixel "S" sign in Squzo blue, softly glowing
  const s = ['.XXXXXXXX.', 'XX......XX', 'XX........', '.XXXXXXX..', '........XX', 'XX......XX', '.XXXXXXXX.'];
  s.forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && px.set(x + 2 + i, y + 2 + j, '#7cc4ff')));
  for (let j = -4; j < 17; j++) for (let i = -4; i < 20; i++) if (!px.has(x + i - 2, y + j - 2) || j < -2 || j > 14 || i < -2 || i > 16) px.set(x + i - 2, y + j - 2, '#5aa9e6', 0.05);
}

function cup(px: Px, x: number, y: number) {
  const r = ramp('#d4a63a');
  px.rect(x + 2, y, 7, 5, r[4]);
  px.rect(x + 2, y, 7, 1, r[6]);
  px.rect(x, y + 1, 2, 2, r[3]);
  px.rect(x + 9, y + 1, 2, 2, r[3]);
  px.rect(x + 4, y + 5, 3, 2, r[2]);
  px.rect(x + 3, y + 7, 5, 2, '#3a2a1e');
}

function plaque(px: Px, x: number, y: number) {
  px.rect(x, y, 16, 10, '#3a2a1e');
  px.rect(x + 1, y + 1, 14, 8, '#d4a63a');
  px.rect(x + 1, y + 1, 14, 1, '#f3d27a');
  px.rect(x + 4, y + 4, 8, 1, '#7a5a1e');
  px.rect(x + 5, y + 6, 6, 1, '#7a5a1e');
}

function shelf(px: Px, x: number, y: number, w: number) {
  px.rect(x, y, w, 2, '#5a4030');
  px.rect(x, y, w, 1, '#7a5a42');
  px.rect(x + 2, y + 2, 1, 3, '#3a2a1e');
  px.rect(x + w - 3, y + 2, 1, 3, '#3a2a1e');
}

/** Earned trophies go in the same spots in every garage. */
function trophies(px: Px, t: Set<string>, opts: { dark?: boolean } = {}) {
  if (t.has('t-banner')) banner(px, 150, 8);
  if (t.has('t-sign')) lightSign(px, 108, 14);
  if (t.has('t-cup') || t.has('t-plaque')) {
    shelf(px, 8, 46, 30);
    if (t.has('t-cup')) cup(px, 12, 37);
    if (t.has('t-plaque')) plaque(px, 22, 36);
  }
  if (t.has('t-flag')) flag(px, 176, 52);
  if (t.has('t-tyres')) tyreStack(px, 174, 3);
  void opts;
}

/* ------------------------------------------------------------------ places */

export const GARAGE_ART: Record<string, Env> = {
  /** Starter lock-up: roller door, block wall, one work light. */
  'gx-lockup'(px, t) {
    vgrad(px, 0, FLOOR, '#3a4150', '#2a303b');
    // block wall
    for (let y = 2; y < FLOOR; y += 6) for (let x = (y / 6) % 2 ? 0 : 8; x < SCENE_W; x += 16) px.rect(x, y, 1, 6, '#232833');
    for (let y = 2; y < FLOOR; y += 6) px.rect(0, y, SCENE_W, 1, '#232833');
    // roller door
    px.rect(56, 14, 112, FLOOR - 14, '#4b5363');
    for (let y = 16; y < FLOOR; y += 3) px.rect(56, y, 112, 1, '#3a4150');
    px.rect(54, 12, 116, 3, '#1d222b');
    px.rect(54, 12, 2, FLOOR - 12, '#1d222b');
    px.rect(168, 12, 2, FLOOR - 12, '#1d222b');
    // work light
    px.rect(110, 0, 1, 6, '#16171c');
    px.rect(106, 6, 9, 3, '#2a2c33');
    px.rect(107, 9, 7, 1, '#fff1c2');
    cone(px, 110, 10, 52, '#ffe2a0', 0.12);
    floorTiles(px, '#4a515e', '#3a404b');
    // oil stain
    dither(px, 96, FLOOR + 4, 24, 3, '#1d222b', 0.5);
    toolbox(px, 14, FLOOR - 15);
    trophies(px, t);
  },
  /** Tuning workshop: pegboard tools, car-lift posts, parts shelf. */
  'gx-workshop'(px, t) {
    vgrad(px, 0, FLOOR, '#3f4a42', '#2c352f');
    // pegboard
    px.rect(40, 10, 70, 34, '#8a6a46');
    for (let y = 12; y < 44; y += 3) for (let x = 42; x < 110; x += 3) px.set(x, y, '#6a4f33');
    // tools
    px.rect(46, 16, 2, 14, '#c9ced6');
    px.rect(44, 15, 6, 3, '#c9ced6');
    px.rect(54, 16, 2, 16, '#c9ced6');
    px.disc(55, 16, 2, '#c9ced6');
    px.rect(64, 15, 3, 12, '#c0392b');
    px.rect(64, 27, 3, 4, '#c9ced6');
    px.rect(74, 18, 12, 3, '#e5b80b');
    px.rect(90, 16, 2, 18, '#c9ced6');
    px.rect(98, 16, 6, 6, '#2f6b4f');
    // lift posts
    for (const x of [58, 172]) {
      px.rect(x, 20, 4, FLOOR - 20, '#d4a63a');
      px.rect(x, 20, 1, FLOOR - 20, '#f0cf73');
      for (let y = 24; y < FLOOR; y += 6) px.rect(x, y, 4, 1, '#16171c');
    }
    // parts shelf
    shelf(px, 120, 30, 44);
    px.rect(124, 22, 8, 8, '#2a2c33');
    px.disc(140, 26, 4, '#1b1c21');
    px.rect(150, 24, 10, 6, '#5aa9e6');
    px.rect(0, 0, SCENE_W, 4, '#1d241f');
    for (const x of [30, 100, 160]) {
      px.rect(x - 6, 4, 13, 2, '#e9e6dd');
      cone(px, x, 6, 34, '#f4f1ea', 0.08);
    }
    floorTiles(px, '#5b6560', '#47504b');
    toolbox(px, 12, FLOOR - 15);
    tyreStack(px, 158, 2);
    trophies(px, t);
  },
  /** Glass showroom: tall windows with the city, spotlights, turntable. */
  'gx-showroom'(px, t) {
    vgrad(px, 0, FLOOR, '#1c2433', '#121822');
    // windows with skyline
    for (let w = 0; w < 4; w++) {
      const x0 = 8 + w * 46;
      vgrad(px, 8, 70, '#3b5b8a', '#9fb7d4', x0, x0 + 40);
      for (let b = 0; b < 5; b++) {
        const bx = x0 + b * 8 + ((w * 3 + b) % 3);
        const bh = 14 + ((w * 7 + b * 5) % 22);
        px.rect(bx, 70 - bh, 7, bh, '#2b3d5a');
        for (let y = 72 - bh; y < 68; y += 3) for (let x = bx + 1; x < bx + 6; x += 2) if ((x + y + w) % 5 === 0) px.set(x, y, '#ffe2a0');
      }
      px.rect(x0 - 2, 6, 2, 66, '#0d1118');
      px.rect(x0 + 40, 6, 2, 66, '#0d1118');
    }
    px.rect(0, 6, SCENE_W, 2, '#0d1118');
    px.rect(0, 70, SCENE_W, 3, '#0d1118');
    // spotlights
    for (const x of [70, 120]) {
      px.rect(x - 3, 0, 7, 3, '#2a2c33');
      cone(px, x, 3, 40, '#fff6dc', 0.13);
    }
    // glossy floor
    const r = ramp('#2a3242');
    for (let y = FLOOR; y < SCENE_H; y++) for (let x = 0; x < SCENE_W; x++) px.set(x, y, y === FLOOR ? r[5] : r[2]);
    // turntable
    for (let x = 52; x < 182; x++) {
      px.set(x, FLOOR + 1, '#5b6578');
      px.set(x, FLOOR + 2, '#3a4252');
    }
    trophies(px, t, { dark: true });
  },
  /** Rooftop at night: city lights, string lights, parking lines. */
  'gx-rooftop'(px, t) {
    vgrad(px, 0, 60, '#0b1026', '#2a2350');
    for (let i = 0; i < 40; i++) px.set((i * 53) % SCENE_W, (i * 29) % 40, i % 3 ? '#9fb7d4' : '#ffffff');
    // moon
    px.disc(160, 14, 6, '#f3efe0');
    px.disc(163, 12, 5, '#1a1a3a');
    // skyline
    for (let b = 0; b < 16; b++) {
      const bx = b * 12 + (b % 3);
      const bh = 18 + ((b * 13) % 26);
      px.rect(bx, 64 - bh, 11, bh + 4, b % 2 ? '#151a33' : '#1b2140');
      for (let y = 66 - bh; y < 64; y += 3) for (let x = bx + 1; x < bx + 10; x += 2) if ((x * 3 + y + b) % 7 === 0) px.set(x, y, '#ffcf6b');
    }
    // parapet wall
    px.rect(0, 64, SCENE_W, FLOOR - 64, '#2a2f3d');
    px.rect(0, 64, SCENE_W, 2, '#4a5164');
    for (let x = 0; x < SCENE_W; x += 24) px.rect(x, 66, 1, FLOOR - 66, '#232838');
    // string lights
    for (let x = 0; x < SCENE_W; x++) {
      const y = 20 + Math.round(Math.sin((x / SCENE_W) * Math.PI) * 10);
      px.set(x, y, '#3a3d46');
      if (x % 10 === 5) {
        px.set(x, y + 1, '#ffd27a');
        px.set(x, y + 2, '#ffe9b0');
        dither(px, x - 2, y, 5, 5, '#ffd27a', 0.18);
      }
    }
    floorTiles(px, '#3a3f4c', '#2c303b');
    for (const x of [44, 182]) for (let y = FLOOR + 2; y < SCENE_H; y++) px.set(x, y, '#e9e6dd', 0.7);
    trophies(px, t, { dark: true });
  },
  /** Pit lane: grandstand, pit board, tyre stacks. */
  'gx-pitlane'(px, t) {
    vgrad(px, 0, 40, '#6fa8dc', '#cfe3f2');
    // grandstand
    px.rect(0, 26, SCENE_W, 30, '#5b616e');
    for (let y = 28; y < 56; y += 4) {
      px.rect(0, y, SCENE_W, 1, '#3b3e46');
      for (let x = (y % 8) / 2; x < SCENE_W; x += 3) px.set(x, y - 1, ['#d7263d', '#f0b429', '#5aa9e6', '#f4f1ea'][(x + y) % 4], 0.85);
    }
    px.rect(0, 22, SCENE_W, 4, '#2a2c33');
    // pit wall with pit board
    px.rect(0, 56, SCENE_W, FLOOR - 56, '#e9e6dd');
    for (let x = 0; x < SCENE_W; x += 12) px.rect(x, 56, 6, 3, '#d7263d');
    px.rect(0, 59, SCENE_W, 1, '#b8b4aa');
    px.rect(20, 64, 26, 14, '#16171c');
    px.rect(22, 66, 10, 3, '#f0b429');
    px.rect(22, 71, 18, 2, '#f4f1ea');
    px.rect(32, 78, 2, 16, '#8d939d');
    // asphalt
    const r = ramp('#3b3e46');
    for (let y = FLOOR; y < SCENE_H; y++) for (let x = 0; x < SCENE_W; x++) px.set(x, y, y === FLOOR ? r[5] : (x * 7 + y * 3) % 11 === 0 ? r[4] : r[3]);
    for (let x = 0; x < SCENE_W; x++) px.set(x, FLOOR + 9, '#e9e6dd');
    tyreStack(px, 4, 4);
    trophies(px, t);
  },
};

export function drawGarage(env: string, earned: Set<string>): Px {
  const px = new Px(SCENE_W, SCENE_H);
  (GARAGE_ART[env] ?? GARAGE_ART['gx-lockup'])(px, earned);
  return px;
}

const sceneCache = new Map<string, string>();
export function garageSceneUrl(env: string, earned: Set<string>): string {
  const key = `${env}|${[...earned].sort().join(',')}`;
  let url = sceneCache.get(key);
  if (!url) {
    url = drawGarage(env, earned).toDataURL();
    sceneCache.set(key, url);
  }
  return url;
}

/** The character as a sprite at the scene's pixel size. */
export function characterUrl(grid: (string | null)[][]): string {
  const px = new Px(grid[0]?.length ?? 32, grid.length);
  grid.forEach((row, y) => row.forEach((c, x) => c && px.set(x, y, c)));
  return px.toDataURL();
}
