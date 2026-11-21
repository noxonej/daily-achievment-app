import { describe, expect, it } from 'vitest';
import { QUEST_LIBRARY } from '../data/questLibrary';
import { irlStats, questStats, statLevel, statRank, STAT_IDS } from './irlStats';
import { day, stateWith } from '../test/helpers';
import type { Quest } from './types';

describe('IRL stats', () => {
  it('maps every library quest to one or two stats', () => {
    for (const q of QUEST_LIBRARY) {
      const s = questStats(q);
      expect(s.length).toBeGreaterThanOrEqual(1);
      expect(s.length).toBeLessThanOrEqual(2);
      s.forEach((id) => expect(STAT_IDS).toContain(id));
    }
  });

  it('uses the custom pick first, then category, then title words', () => {
    expect(questStats({ title: 'x', category: 'Custom', stats: ['social'] })).toEqual(['social']);
    expect(questStats({ title: 'x', category: 'Finance' })).toEqual(['wealth']);
    expect(questStats({ title: 'Go to the gym', category: 'Custom' })).toEqual(['body']);
    expect(questStats({ title: 'Call grandma', category: 'Custom' })).toEqual(['social']);
    expect(questStats({ title: 'zzz', category: 'Custom' })).toEqual(['discipline']);
  });

  it('levels and ranks', () => {
    expect(statLevel(0)).toBe(1);
    expect(statLevel(810)).toBe(10);
    expect(statLevel(1e9)).toBe(100);
    expect(statRank(1).name).toBe('Bronze');
    expect(statRank(65).name).toBe('Diamond');
  });

  it('comes from saved history (existing players get stats right away)', () => {
    const base = stateWith([]);
    const gym: Quest = { ...base.quests[0], id: 'gym', title: 'Gym', category: 'Body', xp: 50, stats: undefined };
    const read: Quest = { ...base.quests[0], id: 'read', title: 'Read', category: 'Mind', xp: 30, stats: undefined };
    const s = stateWith([{ ...day('2026-11-01', 0), completedQuestIds: ['gym', 'read'] }, { ...day('2026-11-02', 0), completedQuestIds: ['gym', 'gone'] }], { quests: [gym, read] });
    const st = irlStats(s);
    expect(st.body.points).toBe(100);
    expect(st.mind.points).toBe(30);
    expect(st.discipline.points).toBe(10); // deleted quest
    expect(st.body.level).toBeGreaterThan(st.mind.level);
  });
});
