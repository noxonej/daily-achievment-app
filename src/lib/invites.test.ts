import { describe, expect, it } from 'vitest';
import { rewardable, INVITE_COINS, INVITE_ITEM, INVITED_GIFT, MAX_INVITE_REWARDS, dayNumber } from './invites';
import { reducer } from '../store/reducer';
import { createInitialState } from '../store/state';
import { isOwned, AVATAR_ITEMS } from '../data/avatar';

const row = (friend: string, days: number, claimed = false) => ({ friend, name: friend, days, claimed });

describe('invite rewards', () => {
  it('pays only friends with 3 days, not yet claimed, up to the cap', () => {
    expect(rewardable([row('a', 2), row('b', 3), row('c', 3, true), row('d', 5)], ['d']).map((r) => r.friend)).toEqual(['b']);
    const paid = Array.from({ length: MAX_INVITE_REWARDS - 1 }, (_, i) => `p${i}`);
    expect(rewardable([row('x', 3), row('y', 3)], paid)).toHaveLength(1);
  });
  it('inviter gets coins + the cap once per friend; invited friend gets the cap once', () => {
    let s = createInitialState();
    s = reducer(s, { type: 'INVITE_REWARD', friend: 'a', name: 'A' });
    s = reducer(s, { type: 'INVITE_REWARD', friend: 'a', name: 'A' });
    s = reducer(s, { type: 'INVITE_REWARD', friend: 'b', name: 'B' });
    expect(s.bonusShards).toBe(2 * INVITE_COINS);
    expect(s.wonCosmeticIds.filter((id) => id === INVITE_ITEM)).toHaveLength(1);
    let t = reducer(createInitialState(), { type: 'INVITE_REWARD' });
    t = reducer(t, { type: 'INVITE_REWARD' });
    expect(t.gifts).toEqual([INVITED_GIFT]);
    expect(t.bonusShards).toBe(0);
    const cap = AVATAR_ITEMS.find((i) => i.id === INVITE_ITEM)!;
    expect(isOwned(cap, { bought: [], won: t.wonCosmeticIds, level: 1, longestStreak: 0 })).toBe(true);
    expect(isOwned(cap, { bought: [], won: [], level: 99, longestStreak: 999 })).toBe(false);
  });
  it('day number matches the rules (UTC days since 1970)', () => {
    expect(dayNumber(Date.UTC(2026, 10, 21, 23, 59))).toBe(dayNumber(Date.UTC(2026, 10, 21, 0, 0)));
    expect(dayNumber(Date.UTC(2026, 10, 22))).toBe(dayNumber(Date.UTC(2026, 10, 21)) + 1);
  });
});
