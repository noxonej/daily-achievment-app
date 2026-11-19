import type { AppState, DayLog } from '../lib/types';
import { createInitialState } from '../store/reducer';

/** A day log where `n` quests were finished. */
export function day(date: string, n = 1, xp = 30): DayLog {
  return { date, completedQuestIds: Array.from({ length: n }, (_, i) => `q${i}`), xpEarned: xp * n, perfectDay: false, dailyQuestCount: 4 };
}

/** A fresh state with these finished days. */
export function stateWith(days: DayLog[], patch: Partial<AppState> = {}): AppState {
  const s = createInitialState();
  return { ...s, onboarded: true, dayLogs: Object.fromEntries(days.map((d) => [d.date, d])), ...patch };
}
