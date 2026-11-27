import type { DecorSlot, PlacedDecor, WorldState } from '../../lib/types';
import { DECOR, DECOR_SLOTS, decorFor, type DecorItem } from '../catalog';

/**
 * Free decorating (2026-11-27). Decorations (posters, art, shelves, plants, collectibles, lamps and
 * rugs) are no longer stuck in one spot each: you can put as many as you like (up to MAX_PLACED),
 * the same one more than once, anywhere on the wall or floor. The big pieces stay unique: one bed,
 * one sofa and one desk setup (desk, chair, computer), plus the window and ceiling light.
 *
 * Positions are saved in world.layout (top-left corner in room units, 1200 × 560). Older saves
 * have no layout yet: layoutOf() builds one from the spots they had and their extra shelves.
 */

export const MOVABLE: DecorSlot[] = ['poster', 'art', 'shelf', 'plant', 'collectible', 'lamp', 'rug'];
export const WALL: DecorSlot[] = ['poster', 'art', 'shelf'];
export const MAX_PLACED = 30;
export const isMovable = (slot: DecorSlot) => MOVABLE.includes(slot);
export const onWall = (slot: DecorSlot) => WALL.includes(slot);

const SCALE = { s: 0.7, m: 1, l: 1.35 } as const;

export function rectOf(slot: DecorSlot): [number, number, number, number] {
  return DECOR_SLOTS.find((s) => s.id === slot)!.rect;
}

/** Where everything movable is. Saves without a layout get one made from their old spots. */
export function layoutOf(world: WorldState): PlacedDecor[] {
  if (world.layout) return world.layout;
  const out: PlacedDecor[] = [];
  for (const slot of MOVABLE) {
    const item = decorFor(world, slot);
    if (item.model === 'none') continue;
    const [x, y] = rectOf(slot);
    const size = slot === 'poster' || slot === 'art' ? world.sizes?.[slot] : undefined;
    const p: PlacedDecor = { uid: slot, id: item.id, x, y };
    if (size && size !== 'm') {
      // Old sizes grew from the middle of the spot; keep the picture where it was.
      const [, , w, h] = rectOf(slot);
      const k = SCALE[size];
      p.x = Math.round(x + (w - w * k) / 2);
      p.y = Math.round(y + (h - h * k) / 2);
      p.s = size;
    }
    out.push(p);
  }
  (world.extras ?? []).forEach((e, i) => {
    if (DECOR.some((d) => d.id === e.id)) out.push({ uid: `x${i}`, id: e.id, x: e.x, y: e.y });
  });
  return out;
}

export function itemOf(p: Pick<PlacedDecor, 'id'>): DecorItem | undefined {
  return DECOR.find((d) => d.id === p.id);
}

/** The box an item takes up in the room: [x, y, w, h]. */
export function boxOf(p: Pick<PlacedDecor, 'id' | 'x' | 'y' | 's'>): [number, number, number, number] {
  const item = itemOf(p);
  const [, , w, h] = item ? rectOf(item.slot) : [0, 0, 80, 80];
  const k = SCALE[p.s ?? 'm'];
  return [p.x, p.y, w * k, h * k];
}

/** SVG transform that moves an item drawn at its old spot to where it is placed (and its size). */
export function placeTransform(p: Pick<PlacedDecor, 'id' | 'x' | 'y' | 's'>): string {
  const item = itemOf(p);
  if (!item) return '';
  const [rx, ry] = rectOf(item.slot);
  const k = SCALE[p.s ?? 'm'];
  return `translate(${p.x} ${p.y}) scale(${k}) translate(${-rx} ${-ry})`;
}

/** Keeps an item on its surface: wall things on the wall, floor things standing on the floor. */
export function clampSpot(slot: DecorSlot, x: number, y: number, w: number, h: number): { x: number; y: number } {
  const cx = Math.round(Math.min(1200 - 36 - w, Math.max(36, x)));
  if (onWall(slot)) return { x: cx, y: Math.round(Math.min(388 - h, Math.max(34, y))) };
  if (slot === 'rug') return { x: cx, y: Math.round(Math.min(556 - h, Math.max(410, y))) };
  // Standing things: their feet between the back of the floor and the front edge.
  const feet = Math.min(552, Math.max(430, y + h));
  return { x: cx, y: Math.round(feet - h) };
}

/** The part of a box that collides: whole picture on the wall, the base strip on the floor. */
function footprint(slot: DecorSlot, [x, y, w, h]: [number, number, number, number]): [number, number, number, number] {
  if (onWall(slot) || slot === 'rug') return [x, y, w, h];
  return [x + w * 0.12, y + h - 26, w * 0.76, 26];
}

function overlapShare(a: [number, number, number, number], b: [number, number, number, number]): number {
  const ix = Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]));
  const iy = Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
  return (ix * iy) / Math.max(1, Math.min(a[2] * a[3], b[2] * b[3]));
}

/** Big furniture's floor footprint (things can't stand inside a bed or sofa). */
function furnitureFeet(world: WorldState): Array<[number, number, number, number]> {
  const out: Array<[number, number, number, number]> = [];
  for (const slot of ['bed', 'seat', 'desk', 'chair', 'table'] as DecorSlot[]) {
    if (decorFor(world, slot).model === 'none') continue;
    const [x, y, w, h] = rectOf(slot);
    out.push([x + 10, y + h - 40, w - 20, 40]);
  }
  return out;
}

/**
 * Why a spot doesn't work (or null when it's fine): overlapping another decoration on the same
 * surface, the window, or a big piece of furniture.
 */
export function blockedBy(world: WorldState, layout: PlacedDecor[], cand: Pick<PlacedDecor, 'id' | 'x' | 'y' | 's'> & { uid?: string }): string | null {
  const item = itemOf(cand);
  if (!item) return 'unknown';
  const fp = footprint(item.slot, boxOf(cand));
  const wall = onWall(item.slot);
  const rug = item.slot === 'rug';
  for (const o of layout) {
    if (o.uid === cand.uid) continue;
    const oi = itemOf(o);
    if (!oi) continue;
    // Rugs only bump into rugs; standing things into standing things; wall things into wall things.
    const same = onWall(oi.slot) === wall && (oi.slot === 'rug') === rug;
    if (same && overlapShare(fp, footprint(oi.slot, boxOf(o))) > 0.2) return oi.name;
  }
  if (wall) {
    const [x, y, w, h] = rectOf('window');
    if (overlapShare(fp, [x + 10, y + 10, w - 20, h - 20]) > 0.05) return 'the window';
  } else if (!rug) {
    for (const f of furnitureFeet(world)) if (overlapShare(fp, f) > 0.25) return 'the furniture';
  }
  return null;
}

/** A free spot for a new item: its usual spot if it's free, otherwise the nearest free one. */
export function freeSpot(world: WorldState, layout: PlacedDecor[], id: string): { x: number; y: number } {
  const item = itemOf({ id });
  if (!item) return { x: 600, y: 300 };
  const [rx, ry, w, h] = rectOf(item.slot);
  const tries: Array<{ x: number; y: number }> = [];
  for (let d = 0; d <= 1200; d += 40) for (const sx of d ? [d, -d] : [0]) for (const dy of [0, -60, 60, -120]) tries.push(clampSpot(item.slot, rx + sx, ry + dy, w, h));
  return tries.find((t) => !blockedBy(world, layout, { id, ...t })) ?? clampSpot(item.slot, rx, ry, w, h);
}
