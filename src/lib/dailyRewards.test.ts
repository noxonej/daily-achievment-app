import { describe, expect, it } from 'vitest';
import { WILDCARD_THEMES } from '../data/wildcardPool';
import { buildWildcardQuestForDate, wildcardOptionsFor, wildcardThemeFor } from './wildcard';
import { jackpotPool, rollBox } from './dailyBox';
import { DEFAULT_WORLD } from '../world/catalog';
import { reducer } from '../store/reducer';
import { stateWith } from '../test/helpers';
import { todayKey } from './date';

describe('daily bonus quest themes', () => {
  it('maps weekdays to themes', () => {
    expect(wildcardThemeFor('2026-11-23').id).toBe('money'); // Monday
    expect(wildcardThemeFor('2026-11-22').id).toBe('reset'); // Sunday
  });
  it('offers three different options from the day theme', () => {
    const opts = wildcardOptionsFor('2026-11-23');
    expect(new Set(opts.map((o) => o.title)).size).toBe(3);
    const pool = WILDCARD_THEMES[0].pool.map((s) => s.title);
    for (const o of opts) expect(pool).toContain(o.title);
  });
  it('rarely repeats: a theme shows different quests on the next week', () => {
    const a = wildcardOptionsFor('2026-11-23').map((o) => o.title);
    const b = wildcardOptionsFor('2026-11-30').map((o) => o.title);
    expect(a.some((x) => b.includes(x))).toBe(false);
  });
  it('builds the picked option and money quests feed wealth', () => {
    const q = buildWildcardQuestForDate('2026-11-23', 2);
    expect(q.title).toBe(wildcardOptionsFor('2026-11-23')[2].title);
    expect(q.stats?.[0]).toBe('wealth');
  });
});

describe('daily box jackpot', () => {
  it('rolls a World item 1 in 100', () => {
    const pool = jackpotPool(DEFAULT_WORLD, 1);
    expect(pool.length).toBeGreaterThan(0);
    expect(rollBox([], () => 0.005, pool).kind).toBe('jackpot');
    expect(rollBox([], () => 0.5, pool).kind).not.toBe('jackpot');
  });
  it('never offers legendary or far-off items', () => {
    const ids = jackpotPool(DEFAULT_WORLD, 1).map((p) => p.id);
    expect(ids).not.toContain('penthouse');
    expect(ids.some((id) => id.startsWith('lg-'))).toBe(false);
  });
  it('the reducer gives the item for free, once a quest is done', () => {
    const today = todayKey();
    const s = stateWith([{ date: today, completedQuestIds: ['q0'], xpEarned: 30, perfectDay: false, dailyQuestCount: 4 }]);
    const prize = jackpotPool(DEFAULT_WORLD, 1)[0];
    const next = reducer(s, { type: 'OPEN_DAILY_BOX', reward: { kind: 'jackpot', id: prize.id, name: prize.name, what: prize.what } });
    expect(next.world?.paid[prize.id]).toBe(0);
    const fake = reducer(s, { type: 'OPEN_DAILY_BOX', reward: { kind: 'jackpot', id: 'penthouse', name: 'x', what: 'home' } });
    expect(fake.world?.paid?.penthouse).toBeUndefined();
  });
});
