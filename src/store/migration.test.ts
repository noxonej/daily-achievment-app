import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEGACY_STORAGE_KEY, loadState } from './AppContext';
import { CONTENT_VERSION, reducer } from './reducer';
import { computeDerivedStats } from '../lib/stats';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 19, 12));
});
afterEach(() => vi.useRealTimers());

/** A save from the first "Quest Log" version (October 2026): no money, world, prefs, version… */
const OLD_SAVE = {
  quests: [
    { id: 'default-0', title: 'Drink 2L of water', frequency: 'daily', difficulty: 'easy', xp: 10, icon: '💧', category: 'health', custom: false, archived: false, createdAt: '2026-10-01T08:00:00.000Z' },
    { id: 'my-1', title: 'Practice guitar', frequency: 'daily', difficulty: 'medium', xp: 20, icon: '🎸', category: 'skills', custom: true, archived: false, createdAt: '2026-10-02T08:00:00.000Z' },
  ],
  goals: [],
  dayLogs: {
    '2026-11-17': { date: '2026-11-17', completedQuestIds: ['default-0'], xpEarned: 10, perfectDay: false, dailyQuestCount: 2, freeNote: 'My diary page' },
    '2026-11-18': { date: '2026-11-18', completedQuestIds: ['default-0', 'my-1'], xpEarned: 30, perfectDay: true, dailyQuestCount: 2 },
  },
  weekLogs: {},
  unlockedAchievements: [{ id: 'first-quest', unlockedAt: '2026-10-01T09:00:00.000Z' }],
  lastOpenedDate: '2026-11-18',
  wildcardEnabled: true,
  character: { body: 'old-body-id', hair: 'spiky' },
  unlockedCosmeticIds: [],
  wonCosmeticIds: [],
  chestsOpened: 0,
  bonusShards: 0,
};

describe('loading old saves (migration safety)', () => {
  it('loads a first-version save without losing progress', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(OLD_SAVE));
    const s = loadState(LEGACY_STORAGE_KEY);
    expect(s.onboarded).toBe(true); // existing users never see first-run setup again
    expect(s.contentVersion).toBe(CONTENT_VERSION);
    expect(s.quests.find((q) => q.id === 'my-1')?.title).toBe('Practice guitar');
    expect(s.dayLogs['2026-11-17'].freeNote).toBe('My diary page');
    expect(s.money).toBeTruthy();
    expect(s.prefs).toBeTruthy();
    const stats = computeDerivedStats(s);
    expect(stats.totalXp).toBe(40); // past days keep exactly what they earned
    expect(stats.currentStreak).toBe(2);
    // The old water quest becomes a glasses counter, and quest XP got the +50% from v7.
    expect(s.quests.find((q) => q.id === 'default-0')?.measure?.unit).toBe('glasses');
    expect(s.quests.find((q) => q.id === 'my-1')?.xp).toBe(30);
  });

  it('keeps the original save untouched and works with the app afterwards', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(OLD_SAVE));
    const s = loadState(LEGACY_STORAGE_KEY);
    expect(JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY)!)).toEqual(OLD_SAVE);
    const next = reducer(s, { type: 'TOGGLE_QUEST', questId: 'my-1' });
    expect(next.dayLogs['2026-11-19'].completedQuestIds).toContain('my-1');
  });

  it('a damaged save starts fresh but is kept aside (rescued), not deleted', async () => {
    localStorage.setItem('dayforge-state-x', '{"broken');
    const s = loadState('dayforge-state-x');
    expect(s.quests.length).toBeGreaterThan(0);
    expect(localStorage.getItem('dayforge-state-x')).toBe('{"broken');
  });

  it('importing a backup file from an old version works the same way', () => {
    const fresh = loadState('nothing-here');
    const s = reducer(fresh, { type: 'IMPORT_STATE', state: OLD_SAVE as never });
    expect(s.onboarded).toBe(true);
    expect(computeDerivedStats(s).totalXp).toBe(40);
  });
});
