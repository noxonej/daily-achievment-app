import { describe, expect, it } from 'vitest';
import { reducer } from './reducer';
import { createInitialState } from './state';
import { todayKey } from '../lib/date';
import { FIRST_WIN_XP } from '../lib/firstWin';

describe('first win', () => {
  it('gives the welcome XP once and logs the task as done today', () => {
    let s = reducer(createInitialState(), { type: 'FIRST_WIN', title: 'Drink a glass of water' });
    s = reducer(s, { type: 'FIRST_WIN', title: 'Drink a glass of water' });
    expect(s.bonusXp).toBe(FIRST_WIN_XP);
    expect(s.dayLogs[todayKey()].quickTasks).toHaveLength(1);
    expect(s.dayLogs[todayKey()].quickTasks![0].done).toBe(true);
  });
  it('onboarding keeps only the picked daily quests active', () => {
    const init = createInitialState();
    const daily = init.quests.filter((q) => q.frequency === 'daily' && !q.custom && !q.wildcardDate);
    const keep = daily.slice(0, 3).map((q) => q.title);
    const s = reducer(init, { type: 'COMPLETE_ONBOARDING', profile: { ...init.profile, focusAreas: [] }, plan: {}, keep } as never);
    const active = s.quests.filter((q) => q.frequency === 'daily' && !q.custom && !q.wildcardDate && !q.archived);
    expect(active.map((q) => q.title).sort()).toEqual([...keep].sort());
    expect(s.onboarded).toBe(true);
  });
});
