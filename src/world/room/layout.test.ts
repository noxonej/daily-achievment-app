import { describe, expect, it } from 'vitest';
import { reducer } from '../../store/reducer';
import { createInitialState } from '../../store/state';
import type { AppState } from '../../lib/types';
import { DECOR } from '../catalog';
import { MAX_PLACED, blockedBy, boxOf, freeSpot, layoutOf } from './layout';

const plant = DECOR.find((d) => d.slot === 'plant' && d.model !== 'none')!;
const poster = DECOR.find((d) => d.slot === 'poster' && d.model !== 'none')!;

function rich(): AppState {
  const s = createInitialState();
  return { ...s, onboarded: true, world: { property: 'room', decor: {}, paid: { [plant.id]: 0, [poster.id]: 0 }, extras: [{ id: 'shelf-trophy', x: 100, y: 60 }] } };
}

describe('free decorating', () => {
  it('builds a layout from old spots and extra shelves (old saves keep their room)', () => {
    const l = layoutOf(rich().world!);
    expect(l.some((p) => p.uid === 'plant')).toBe(true);
    expect(l.some((p) => p.uid === 'x0' && p.id === 'shelf-trophy')).toBe(true);
  });

  it('places the same plant several times, moves and removes them, and keeps the rest', () => {
    let s = rich();
    s = reducer(s, { type: 'WORLD_LAYOUT_ADD', uid: 'a', itemId: plant.id, x: 100, y: 330 });
    s = reducer(s, { type: 'WORLD_LAYOUT_ADD', uid: 'b', itemId: plant.id, x: 1000, y: 330 });
    const ids = s.world!.layout!.filter((p) => p.id === plant.id).map((p) => p.uid);
    expect(ids).toEqual(expect.arrayContaining(['plant', 'a', 'b']));
    s = reducer(s, { type: 'WORLD_LAYOUT_MOVE', uid: 'a', x: 200, y: 330 });
    expect(s.world!.layout!.find((p) => p.uid === 'a')!.x).toBe(200);
    s = reducer(s, { type: 'WORLD_LAYOUT_REMOVE', uid: 'b' });
    expect(s.world!.layout!.some((p) => p.uid === 'b')).toBe(false);
    // Saved state round-trips (what reopening the app does).
    const back = JSON.parse(JSON.stringify(s)) as AppState;
    expect(layoutOf(back.world!)).toEqual(s.world!.layout);
  });

  it('keeps things on their surface', () => {
    let s = rich();
    s = reducer(s, { type: 'WORLD_LAYOUT_ADD', uid: 'p', itemId: poster.id, x: 300, y: 520 });
    const p = s.world!.layout!.find((x) => x.uid === 'p')!;
    expect(p.y + boxOf(p)[3]).toBeLessThanOrEqual(388);
    s = reducer(s, { type: 'WORLD_LAYOUT_ADD', uid: 'q', itemId: plant.id, x: 300, y: 0 });
    const q = s.world!.layout!.find((x) => x.uid === 'q')!;
    expect(q.y + boxOf(q)[3]).toBeGreaterThanOrEqual(430);
  });

  it('does not place things you do not own, or more than the limit', () => {
    let s = rich();
    const other = DECOR.find((d) => d.slot === 'plant' && d.model !== 'none' && d.id !== plant.id && d.unlock.coins > 0)!;
    expect(reducer(s, { type: 'WORLD_LAYOUT_ADD', uid: 'z', itemId: other.id, x: 0, y: 0 })).toBe(s);
    for (let i = 0; i < MAX_PLACED + 5; i++) s = reducer(s, { type: 'WORLD_LAYOUT_ADD', uid: `n${i}`, itemId: plant.id, x: i * 30, y: 330 });
    expect(s.world!.layout!.length).toBe(MAX_PLACED);
  });

  it('spots overlaps and finds a free spot', () => {
    const s = rich();
    const l = layoutOf(s.world!);
    const own = l.find((p) => p.uid === 'plant')!;
    expect(blockedBy(s.world!, l, { id: plant.id, x: own.x + 5, y: own.y })).toBeTruthy();
    const free = freeSpot(s.world!, l, plant.id);
    expect(blockedBy(s.world!, l, { id: plant.id, ...free })).toBeNull();
  });

  it('a decoration bought while trying it lands where it was previewed', () => {
    const s0 = { ...rich(), bonusXp: 999999 };
    const buy = DECOR.find((d) => d.slot === 'poster' && d.model !== 'none' && d.unlock.coins > 0 && !d.unlock.chest && !d.unlock.milestone && !d.unlock.legendary)!;
    const s = reducer(s0, { type: 'WORLD_BUY', id: buy.id, at: { x: 640, y: 60 }, uid: 'bought' });
    const p = s.world!.layout!.find((x) => x.uid === 'bought');
    expect(p).toMatchObject({ id: buy.id, x: 640 });
  });
});
