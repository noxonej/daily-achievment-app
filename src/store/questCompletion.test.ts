import { describe, expect, it } from 'vitest';
import { reducer } from './reducer';
import { createInitialState } from './state';
import { todayKey, weekKey } from '../lib/date';
import { checkNote, noteDone } from '../lib/questRules';
import type { AppState, Quest } from '../lib/types';

/**
 * 2026-11-24: written quests used to complete themselves while you were still typing (0.4 s after
 * the word count was reached). Now typing only saves; "Mark done" completes, if the answer passes.
 */

function withQuest(q: Partial<Quest>): { s: AppState; quest: Quest } {
  const base = createInitialState();
  const quest: Quest = {
    id: q.id ?? 'note-test',
    title: q.title ?? 'Journal',
    frequency: q.frequency ?? 'daily',
    difficulty: 'medium',
    xp: 30,
    icon: '📓',
    category: 'Mind',
    promptForNote: true,
    ...q,
  } as Quest;
  return { s: { ...base, onboarded: true, quests: [...base.quests, quest] }, quest };
}

const daily = (s: AppState) => s.dayLogs[todayKey()]?.completedQuestIds ?? [];
const weekly = (s: AppState) => s.weekLogs[weekKey()]?.completedQuestIds ?? [];
const LONG = 'Today I finished the first chapter and I felt really calm afterwards';

describe('written quests: typing is not finishing', () => {
  it('a long enough answer that is only typed stays not done', () => {
    const { s, quest } = withQuest({ noteMinWords: 10 });
    let n = s;
    // Every keystroke of the sentence, as the debounced saves would send them.
    for (let i = 1; i <= LONG.length; i++) n = reducer(n, { type: 'SET_QUEST_NOTE', questId: quest.id, note: LONG.slice(0, i) });
    expect(checkNote(quest, LONG).done).toBe(true);
    expect(daily(n)).not.toContain(quest.id);
    expect(n.dayLogs[todayKey()].notes?.[quest.id]).toBe(LONG);
    expect(n.dayLogs[todayKey()].xpEarned).toBe(0);
  });

  it('"Mark done" completes it once the rule passes', () => {
    const { s, quest } = withQuest({ noteMinWords: 10 });
    const n = reducer(s, { type: 'SET_QUEST_NOTE', questId: quest.id, note: LONG, done: true });
    expect(daily(n)).toContain(quest.id);
    expect(n.dayLogs[todayKey()].xpEarned).toBeGreaterThan(0);
  });

  it('"Mark done" with a too-short answer does nothing', () => {
    const { s, quest } = withQuest({ noteMinWords: 10 });
    const n = reducer(s, { type: 'SET_QUEST_NOTE', questId: quest.id, note: 'too short', done: true });
    expect(daily(n)).not.toContain(quest.id);
  });

  it('fixing a typo after finishing keeps it done; deleting below the rule un-does it', () => {
    const { s, quest } = withQuest({ noteMinWords: 10 });
    let n = reducer(s, { type: 'SET_QUEST_NOTE', questId: quest.id, note: LONG, done: true });
    n = reducer(n, { type: 'SET_QUEST_NOTE', questId: quest.id, note: LONG + ' too' });
    expect(daily(n)).toContain(quest.id);
    n = reducer(n, { type: 'SET_QUEST_NOTE', questId: quest.id, note: 'Today I' });
    expect(daily(n)).not.toContain(quest.id);
    // Typing it long again doesn't silently re-complete it.
    n = reducer(n, { type: 'SET_QUEST_NOTE', questId: quest.id, note: LONG });
    expect(daily(n)).not.toContain(quest.id);
  });

  it('"Undo" un-completes but keeps the text', () => {
    const { s, quest } = withQuest({ noteMinWords: 10 });
    let n = reducer(s, { type: 'SET_QUEST_NOTE', questId: quest.id, note: LONG, done: true });
    n = reducer(n, { type: 'SET_QUEST_NOTE', questId: quest.id, note: LONG, done: false });
    expect(daily(n)).not.toContain(quest.id);
    expect(n.dayLogs[todayKey()].notes?.[quest.id]).toBe(LONG);
  });

  it('list quests: the third item half-typed does not finish "Gratitude x3"', () => {
    const { s, quest } = withQuest({ title: 'Gratitude x3', noteList: 3 });
    let n = s;
    const typed = ['My mom', 'My mom\nSunny weather', 'My mom\nSunny weather\nMy d', 'My mom\nSunny weather\nMy dog'];
    for (const note of typed) n = reducer(n, { type: 'SET_QUEST_NOTE', questId: quest.id, note });
    expect(daily(n)).not.toContain(quest.id);
    n = reducer(n, { type: 'SET_QUEST_NOTE', questId: quest.id, note: typed[3], done: true });
    expect(daily(n)).toContain(quest.id);
  });

  it('list quests: duplicates never count, even with "Mark done"', () => {
    const { s, quest } = withQuest({ title: 'Gratitude x3', noteList: 3 });
    const n = reducer(s, { type: 'SET_QUEST_NOTE', questId: quest.id, note: 'Family\nfamily\nFamily', done: true });
    expect(daily(n)).not.toContain(quest.id);
  });

  it('weekly written quests follow the same rule', () => {
    const { s, quest } = withQuest({ id: 'weekly-note', title: 'Weekly reflection', frequency: 'weekly' });
    let n = reducer(s, { type: 'SET_QUEST_NOTE', questId: quest.id, note: LONG });
    expect(weekly(n)).not.toContain(quest.id);
    n = reducer(n, { type: 'SET_QUEST_NOTE', questId: quest.id, note: LONG, done: true });
    expect(weekly(n)).toContain(quest.id);
  });
});

describe('other quest types only complete on a real action', () => {
  it('number quests complete when the saved total reaches the target, not before', () => {
    const base = createInitialState();
    const q = base.quests.find((x) => x.measure && x.frequency === 'daily' && x.measure.unit !== 'steps');
    expect(q).toBeTruthy();
    const target = q!.measure!.target;
    let n = reducer(base, { type: 'SET_PROGRESS', questId: q!.id, value: target - 1 });
    expect(daily(n)).not.toContain(q!.id);
    n = reducer(n, { type: 'SET_PROGRESS', questId: q!.id, value: target });
    expect(daily(n)).toContain(q!.id);
    n = reducer(n, { type: 'SET_PROGRESS', questId: q!.id, value: 0 });
    expect(daily(n)).not.toContain(q!.id);
  });

  it('tick quests toggle on and off', () => {
    const base = createInitialState();
    const q = base.quests.find((x) => x.frequency === 'daily' && !x.measure && !x.promptForNote)!;
    let n = reducer(base, { type: 'TOGGLE_QUEST', questId: q.id });
    expect(daily(n)).toContain(q.id);
    n = reducer(n, { type: 'TOGGLE_QUEST', questId: q.id });
    expect(daily(n)).not.toContain(q.id);
  });

  it('noteDone truth table', () => {
    expect(noteDone(false, true)).toBe(false);
    expect(noteDone(true, true)).toBe(true);
    expect(noteDone(true, false)).toBe(false);
    expect(noteDone(false, true, true)).toBe(true);
    expect(noteDone(false, false, true)).toBe(false);
    expect(noteDone(true, true, false)).toBe(false);
  });
});
