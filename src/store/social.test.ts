import { describe, expect, it } from 'vitest';
import { reducer } from './reducer';
import { stateWith } from '../test/helpers';
import { todayKey, addDaysToKey } from '../lib/date';
import type { Challenge } from '../lib/types';

const ch: Challenge = { code: 'ABCDEFGH', title: 'Test', hostName: 'Host', days: 7, start: todayKey(), quests: [{ title: 'Run', icon: '🏃' }, { title: 'Read', icon: '📖' }], badge: '🏅' };

describe('challenge actions', () => {
  it('join, tick (+XP), untick (−XP), no double join', () => {
    let s = reducer(stateWith([]), { type: 'CHALLENGE_JOIN', challenge: ch });
    s = reducer(s, { type: 'CHALLENGE_JOIN', challenge: ch });
    expect(s.challenges).toHaveLength(1);
    s = reducer(s, { type: 'CHALLENGE_TICK', code: ch.code, index: 0 });
    expect(s.bonusXp).toBe(10);
    expect(s.challenges![0].done[todayKey()]).toEqual([0]);
    s = reducer(s, { type: 'CHALLENGE_TICK', code: ch.code, index: 0 });
    expect(s.bonusXp).toBe(0);
    s = reducer(s, { type: 'CHALLENGE_TICK', code: ch.code, index: 9 });
    expect(s.bonusXp).toBe(0);
  });
  it("doesn't count before the start", () => {
    let s = reducer(stateWith([]), { type: 'CHALLENGE_JOIN', challenge: { ...ch, start: addDaysToKey(todayKey(), 3) } });
    s = reducer(s, { type: 'CHALLENGE_TICK', code: ch.code, index: 0 });
    expect(s.bonusXp ?? 0).toBe(0);
  });
  it('squads list', () => {
    let s = reducer(stateWith([]), { type: 'SQUAD_ADD', code: 'ABCDEFGH' });
    s = reducer(s, { type: 'SQUAD_ADD', code: 'ABCDEFGH' });
    expect(s.squads).toEqual(['ABCDEFGH']);
    s = reducer(s, { type: 'SQUAD_REMOVE', code: 'ABCDEFGH' });
    expect(s.squads).toEqual([]);
  });
});
