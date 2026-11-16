import { Px, mixHex, ramp } from './raster';

/**
 * The Style studio backdrop (2026-11-16): a small dressing room in the same pixel style as the
 * garage, drawn on a 64×44 grid so the character (32 px tall) fills the stage.
 */
export const STUDIO_W = 64;
export const STUDIO_H = 44;
export const STUDIO_FLOOR = 38;

function studio(): Px {
  const px = new Px(STUDIO_W, STUDIO_H);
  // wall: dark panels with a warm top light
  const wall = ramp('#2c2a3a');
  for (let y = 0; y < STUDIO_FLOOR; y++)
    for (let x = 0; x < STUDIO_W; x++) {
      const light = Math.max(0, 1 - Math.hypot((x - 32) / 34, (y - 2) / 30));
      const c = light > 0.66 ? wall[5] : light > 0.4 ? wall[4] : light > 0.15 ? wall[3] : wall[2];
      px.set(x, y, c);
    }
  for (let x = 4; x < STUDIO_W; x += 10) for (let y = 3; y < STUDIO_FLOOR - 4; y++) px.set(x, y, wall[1], 0.6);
  for (let x = 0; x < STUDIO_W; x++) {
    px.set(x, STUDIO_FLOOR - 5, wall[1]);
    px.set(x, STUDIO_FLOOR - 4, wall[5], 0.5);
  }
  // light strip
  for (let x = 14; x < 50; x++) px.set(x, 0, '#fff1cf');
  // clothes rail with garments (left)
  px.rect(1, 6, 12, 1, '#b9bfc8');
  px.rect(1, 6, 1, 26, '#8d939d');
  const garments = ['#d7263d', '#2aa7bd', '#f0b429', '#5b3fd6'];
  garments.forEach((g, i) => {
    const r = ramp(g);
    const x = 2 + i * 3;
    px.set(x + 1, 7, '#b9bfc8');
    px.rect(x, 8, 3, 11 + (i % 2) * 3, r[3]);
    px.rect(x, 8, 1, 11 + (i % 2) * 3, r[5]);
    px.rect(x + 2, 8, 1, 11 + (i % 2) * 3, r[1]);
  });
  // shelf with shoes and a cap
  px.rect(1, 25, 12, 1, '#7a5a42');
  px.rect(2, 23, 4, 2, '#f4f1ea');
  px.rect(7, 23, 4, 2, '#26282f');
  // mirror (right)
  const fr = ramp('#c9a24a');
  px.rect(51, 4, 12, 30, fr[2]);
  px.rect(51, 4, 12, 1, fr[5]);
  px.rect(51, 4, 1, 30, fr[4]);
  for (let y = 6; y < 32; y++)
    for (let x = 53; x < 61; x++) {
      const s = (x - y * 0.8) % 9;
      px.set(x, y, s >= 0 && s < 1.6 ? '#b9c9dd' : mixHex('#4b5d78', '#2c3850', (y - 6) / 26));
    }
  // floor: wood planks
  const fl = ramp('#7a5a42');
  for (let y = STUDIO_FLOOR; y < STUDIO_H; y++)
    for (let x = 0; x < STUDIO_W; x++) px.set(x, y, y === STUDIO_FLOOR ? fl[5] : (x + (y % 2) * 7) % 14 === 0 ? fl[1] : y < STUDIO_FLOOR + 3 ? fl[4] : fl[3]);
  // spotlight pool on the floor
  for (let y = STUDIO_FLOOR + 1; y < STUDIO_H; y++)
    for (let x = 16; x < 48; x++) {
      const d = ((x - 32) / 16) ** 2 + ((y - 41) / 3) ** 2;
      if (d < 1 && (d < 0.55 || (x + y) % 2 === 0)) px.set(x, y, '#ffe9b8', 0.22);
    }
  return px;
}

let url = '';
export function studioUrl(): string {
  if (!url) url = studio().toDataURL();
  return url;
}
