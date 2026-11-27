import { describe, expect, it } from 'vitest';
import { objectiveThemes, sameObjective, swapOptions } from './questSwap';
import { QUEST_LIBRARY } from '../data/questLibrary';
import type { AppState, Quest } from './types';

const q = (title: string, extra: Partial<Quest> = {}): Quest =>
  ({ id: title, title, description: '', frequency: 'daily', difficulty: 'medium', icon: '✅', xp: 20, createdAt: '2026-11-01', ...extra }) as unknown as Quest;

let seed = 1;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

describe('same objective', () => {
  it('catches the same goal with a different duration (Jonas’s phone example)', () => {
    expect(sameObjective({ title: 'Morning without the phone' }, { title: 'First hour without your phone' })).toBe(true);
    expect(sameObjective({ title: 'Read 10 pages' }, { title: 'Read 30 pages' })).toBe(true);
    expect(sameObjective({ title: 'Do 50 push-ups' }, { title: 'Do 100 push-ups' })).toBe(true);
    expect(sameObjective({ title: 'Max 1 hour of social media' }, { title: 'Unfollow 5 accounts that make you feel bad' })).toBe(true);
    expect(sameObjective({ title: 'Drink 2L of water' }, { title: 'Drink 8 glasses of water' })).toBe(true);
  });
  it('keeps different goals apart', () => {
    expect(sameObjective({ title: 'Morning without the phone' }, { title: 'Make your bed' })).toBe(false);
    expect(sameObjective({ title: 'Read 20 pages' }, { title: 'Do 30 sit-ups' })).toBe(false);
  });
  it('gives most library quests a theme', () => {
    const daily = QUEST_LIBRARY.filter((l) => l.frequency === 'daily');
    const themed = daily.filter((l) => objectiveThemes(l.title).size > 0);
    expect(themed.length / daily.length).toBeGreaterThan(0.85);
  });
});

describe('swap options', () => {
  const morning = q('Morning without the phone');
  const state = { quests: [morning, q('Make your bed'), q('Drink 2L of water')], dayLogs: {} } as unknown as Pick<AppState, 'dayLogs' | 'quests'>;

  it('never offers the same objective again, across many swaps', () => {
    for (let i = 0; i < 200; i++) {
      const opts = swapOptions(state, morning, 3, rand, '2026-11-27');
      expect(opts).toHaveLength(3);
      for (const o of opts) {
        expect(sameObjective(o, morning)).toBe(false);
        expect(sameObjective(o, { title: 'Make your bed' })).toBe(false);
        expect(sameObjective(o, { title: 'Drink 2L of water' })).toBe(false);
      }
      // and the three options differ from each other
      expect(sameObjective(opts[0], opts[1]) || sameObjective(opts[1], opts[2]) || sameObjective(opts[0], opts[2])).toBe(false);
    }
  });

  it('is never harder than the quest you swap, and never above medium', () => {
    const lib = new Map(QUEST_LIBRARY.map((l) => [l.title, l.difficulty]));
    const easy = q('Eat a fruit', { difficulty: 'easy' });
    for (let i = 0; i < 50; i++) for (const o of swapOptions({ ...state, quests: [easy] }, easy, 3, rand)) expect(lib.get(o.title) ?? 'easy').toBe('easy');
    const epic = q('2 hours of deep work', { difficulty: 'epic' });
    for (let i = 0; i < 50; i++) for (const o of swapOptions({ ...state, quests: [epic] }, epic, 3, rand)) expect(['easy', 'medium']).toContain(lib.get(o.title) ?? 'easy');
  });

  it('remembers what you swapped away and what swaps offered lately', () => {
    const read = q('Read 20 pages');
    const withHistory = {
      quests: [morning, read],
      dayLogs: { '2026-11-25': { swaps: { [read.id]: { title: 'Stretch 10 minutes', icon: '🤸' } }, completedQuestIds: [] } },
    } as unknown as Pick<AppState, 'dayLogs' | 'quests'>;
    for (let i = 0; i < 100; i++)
      for (const o of swapOptions(withHistory, morning, 3, rand, '2026-11-27')) {
        expect(sameObjective(o, { title: 'Stretch 10 minutes' })).toBe(false);
        expect(sameObjective(o, read)).toBe(false);
      }
  });
});
