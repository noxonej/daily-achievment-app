import { describe, expect, it } from 'vitest';
import { DIFFICULTY_XP, levelFromTotalXp, xpForLevel } from './xp';
import { computeDerivedStats } from './stats';
import { day, stateWith } from '../test/helpers';

describe('XP and levels', () => {
  it('needs 80 XP for level 2, then 30 more each level', () => {
    expect(xpForLevel(1)).toBe(80);
    expect(xpForLevel(2)).toBe(110);
    expect(xpForLevel(10)).toBe(350);
  });

  it('starts at level 1', () => {
    expect(levelFromTotalXp(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForNextLevel: 80 });
  });

  it('levels up exactly at the threshold', () => {
    expect(levelFromTotalXp(79).level).toBe(1);
    expect(levelFromTotalXp(80)).toEqual({ level: 2, xpIntoLevel: 0, xpForNextLevel: 110 });
    expect(levelFromTotalXp(80 + 110 + 5)).toEqual({ level: 3, xpIntoLevel: 5, xpForNextLevel: 140 });
  });

  it('quest XP by difficulty', () => {
    expect(DIFFICULTY_XP).toEqual({ easy: 15, medium: 30, hard: 50, epic: 90 });
  });

  it('total XP adds day logs, week logs and bonus XP', () => {
    const s = stateWith([day('2026-11-18', 2, 30)], {
      bonusXp: 7,
      weekLogs: { '2026-W47': { weekKey: '2026-W47', completedQuestIds: ['w'], xpEarned: 50, perfectWeek: false, weeklyQuestCount: 1 } },
    });
    const stats = computeDerivedStats(s);
    expect(stats.totalXp).toBe(60 + 50 + 7);
    expect(stats.level).toBe(2);
  });
});
