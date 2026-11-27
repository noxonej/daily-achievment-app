import { describe, expect, it } from 'vitest';
import { createInitialState, reducer } from '../store/reducer';
import { computeDerivedStats } from './stats';
import { buildShowcase, decodeGarage, decodeRoom, featuredBadges, parseShowcase } from './showcase';
import type { AppState } from './types';

function withBadges(ids: string[]): AppState {
  const s = createInitialState();
  return { ...s, unlockedAchievements: ids.map((id, i) => ({ id, unlockedAt: `2026-11-0${i + 1}` })) };
}

describe('showcase', () => {
  it('round-trips your room, garage and progress', () => {
    const s = { ...withBadges(['first-quest', 'level-5']), world: { property: 'room', decor: {}, paid: { 'gu-neon': 2200 }, layout: [{ uid: 'a', id: 'plant-monstera', x: 300, y: 400 }] } } as AppState;
    const stats = computeDerivedStats(s);
    const doc = buildShowcase(s, stats, 'Jonas')!;
    expect(doc.who).toBe('friends');
    const sc = parseShowcase('u1', JSON.parse(JSON.stringify(doc)))!;
    expect(sc.name).toBe('Jonas');
    expect(sc.level).toBe(stats.level);
    expect(sc.featured).toEqual(['level-5', 'first-quest']);
    expect(sc.garage?.upgrades.has('gu-neon')).toBe(true);
    expect(sc.room?.world.property).toBe('room');
  });

  it('shows nothing when set to nobody, and leaves out what you turn off', () => {
    const s = createInitialState();
    const stats = computeDerivedStats(s);
    expect(buildShowcase({ ...s, showcase: { who: 'nobody', room: true, garage: true, stats: true, collection: true } }, stats, 'A')).toBeNull();
    const doc = buildShowcase({ ...s, showcase: { who: 'everyone', room: false, garage: false, stats: false, collection: false } }, stats, 'A')!;
    expect(doc.who).toBe('everyone');
    expect(doc.room).toBeUndefined();
    expect(doc.garage).toBeUndefined();
    expect(doc.cars).toBeUndefined();
    expect(doc.quests).toBeUndefined();
  });

  it('drops anything unknown or out of range from a hand-made document', () => {
    const room = decodeRoom(JSON.stringify({ p: 'room', d: { bed: 'not-a-bed', wall: '<script>' }, t: { wall: 'red' }, l: [['nope', 1, 1], ['plant-monstera', 99999, -5, 'xl']] }))!;
    expect(room.decor).toEqual({});
    expect(room.tints).toEqual({});
    for (const p of room.layout ?? []) {
      expect(p.x).toBeLessThanOrEqual(1200);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.s).toBeUndefined();
    }
    expect(decodeRoom('{bad json')).toBeNull();
    const g = decodeGarage(JSON.stringify({ e: 'gx-moon', v: 'v-fake', h: 'javascript:1', m: { rim: 'laser' }, u: ['gu-gold'], t: ['t-flag', 'x'] }))!;
    expect(g.env).toBe('gx-lockup');
    expect(g.vehicle).toBeNull();
    expect(g.hex).toBeUndefined();
    expect(g.parts).toEqual({});
    expect(g.upgrades.size).toBe(0);
    expect([...g.trophies]).toEqual(['t-flag']);
    expect(parseShowcase('x', { name: '', level: 5 })).toBeNull();
    expect(parseShowcase('x', { name: 'B', level: 9999, featured: 'level-5,hacked' })).toMatchObject({ level: 200, featured: ['level-5'] });
  });

  it('features only badges you earned, at most three', () => {
    let s = withBadges(['first-quest', 'level-5', 'streak-3', 'quests-25']);
    s = reducer(s, { type: 'SET_SHOWCASE', showcase: { featured: ['quests-25', 'level-100', 'streak-3', 'first-quest', 'level-5'] } });
    expect(s.showcase?.featured).toEqual(['quests-25', 'streak-3', 'first-quest']);
    expect(featuredBadges(s)).toEqual(['quests-25', 'streak-3', 'first-quest']);
  });
});
