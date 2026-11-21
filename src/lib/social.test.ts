import { describe, expect, it } from 'vitest';
import { asChallenge, challengeDay, cleanCode, fullDays, isFinished, JOIN_CODE, newJoinCode, squadStreak, ticks } from './social';
import type { JoinedChallenge } from './types';

describe('squads', () => {
  it('makes valid join codes', () => {
    for (let i = 0; i < 50; i++) expect(newJoinCode()).toMatch(JOIN_CODE);
    expect(cleanCode(' ab-cd 23ef ')).toBe('ABCD23EF');
  });
  it('squad streak grows only when everyone did a quest', () => {
    const t = '2026-11-21';
    const a = ['2026-11-21', '2026-11-20', '2026-11-19', '2026-11-18'];
    const b = ['2026-11-20', '2026-11-19', '2026-11-17'];
    expect(squadStreak([a, b], t)).toEqual({ days: 2, doneToday: 1, total: 2 });
    expect(squadStreak([a, [...b, t]], t).days).toBe(3);
    expect(squadStreak([], t).days).toBe(0);
  });
});

describe('challenges', () => {
  const ch: JoinedChallenge = { code: 'ABCDEFGH', title: '7 days of discipline', hostName: 'Rokas', days: 7, start: '2026-11-20', quests: [{ title: 'Run', icon: '🏃' }, { title: 'Read', icon: '📖' }], badge: '🏅', joinedAt: '2026-11-20', done: {} };
  it('knows the day', () => {
    expect(challengeDay(ch, '2026-11-19')).toBe(0);
    expect(challengeDay(ch, '2026-11-20')).toBe(1);
    expect(challengeDay(ch, '2026-11-26')).toBe(7);
  });
  it('counts full days and finishes', () => {
    const done: Record<string, number[]> = {};
    for (let i = 0; i < 7; i++) done[`2026-11-${20 + i}`] = [0, 1];
    expect(isFinished({ ...ch, done })).toBe(true);
    expect(fullDays({ ...ch, done: { a: [0], b: [0, 1, 1] } })).toBe(1);
    expect(ticks({ ...ch, done: { a: [0, 0], b: [0, 1] } })).toBe(3);
  });
  it('checks data from the network', () => {
    expect(asChallenge('ABCDEFGH', { title: 'x', hostName: 'h', days: 7, start: '2026-11-20', quests: [{ title: 'a' }] })?.quests[0].icon).toBe('✅');
    expect(asChallenge('ABCDEFGH', { title: 'x', hostName: 'h', days: 9, start: '2026-11-20', quests: [{ title: 'a' }] })).toBeNull();
    expect(asChallenge('bad', { title: 'x', hostName: 'h', days: 7, start: '2026-11-20', quests: [{ title: 'a' }] })).toBeNull();
    expect(asChallenge('ABCDEFGH', { title: 'x', hostName: 'h', days: 7, start: '2026-11-20', quests: [] })).toBeNull();
  });
});
