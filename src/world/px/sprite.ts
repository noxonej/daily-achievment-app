import type { CarMods } from '../../lib/types';
import type { Vehicle } from '../catalog';
import { RIM_COLORS } from '../catalog';
import { SHAPES, drawCar } from './cars';
import { Px } from './raster';
import { drawTwoWheeler } from './twowheel';

export interface Sprite {
  url: string;
  w: number;
  h: number;
}

const cache = new Map<string, Sprite>();
const pxCache = new Map<string, Px>();

/** The vehicle as pixels, every vehicle drawn at the same pixel scale. */
export function vehiclePixels(v: Vehicle, hex: string, parts?: CarMods, lights = false): Px {
  const key = `${v.id}|${hex}|${JSON.stringify(parts ?? {})}|${lights}`;
  const hit = pxCache.get(key);
  if (hit) return hit;
  let px: Px;
  if (v.art.type === 'car') {
    const shape = SHAPES[v.art.shape] ?? SHAPES.hatch;
    px = drawCar(shape, {
      paint: hex,
      rim: parts?.rim,
      rimColor: parts?.rimColor && RIM_COLORS[parts.rimColor] ? RIM_COLORS[parts.rimColor] : undefined,
      spoiler: parts?.spoiler,
      kit: parts?.kit,
      stance: parts?.stance,
      livery: parts?.livery,
      lights,
    });
  } else {
    px = drawTwoWheeler(v.art.model, { paint: hex });
  }
  if (pxCache.size > 400) pxCache.clear();
  pxCache.set(key, px);
  return px;
}

/** Trim empty space around the drawing (keeps 1 pixel of margin). */
export function crop(px: Px): Px {
  let x0 = px.w;
  let y0 = px.h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < px.h; y++)
    for (let x = 0; x < px.w; x++)
      if (px.d[(y * px.w + x) * 4 + 3] > 30) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
  if (x1 < 0) return px;
  const out = new Px(x1 - x0 + 3, y1 - y0 + 3);
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const i = (y * px.w + x) * 4;
      const j = ((y - y0 + 1) * out.w + (x - x0 + 1)) * 4;
      out.d[j] = px.d[i];
      out.d[j + 1] = px.d[i + 1];
      out.d[j + 2] = px.d[i + 2];
      out.d[j + 3] = px.d[i + 3];
    }
  return out;
}

export function vehicleSprite(v: Vehicle, hex: string, parts?: CarMods, opts: { crop?: boolean; lights?: boolean } = {}): Sprite {
  const key = `${v.id}|${hex}|${JSON.stringify(parts ?? {})}|${opts.crop ? 1 : 0}|${opts.lights ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let px = vehiclePixels(v, hex, parts, opts.lights);
  if (opts.crop) px = crop(px);
  const s = { url: px.toDataURL(), w: px.w, h: px.h };
  if (cache.size > 400) cache.clear();
  cache.set(key, s);
  return s;
}
