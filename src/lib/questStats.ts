import type { AppState } from './types';
import { addDaysToKey, todayKey } from './date';

function doneOn(state: AppState, questId: string, date: string): boolean {
  const log = state.dayLogs[date];
  return !!log && (log.completedQuestIds.includes(questId) || !!log.skipped?.includes(questId));
}

/** Days in a row this daily quest was done (today counts once it's done; it doesn't break it yet). */
export function questStreak(state: AppState, questId: string, today: string = todayKey()): number {
  let n = 0;
  let d = doneOn(state, questId, today) ? today : addDaysToKey(today, -1);
  for (let i = 0; i < 2000 && doneOn(state, questId, d); i++) {
    n += 1;
    d = addDaysToKey(d, -1);
  }
  return n;
}

/** How often it was done over the last `days` days (only counting days since the quest was added). */
export function questRate(state: AppState, questId: string, createdAt: string | undefined, days = 30, today: string = todayKey()): { done: number; of: number } {
  const start = createdAt ? createdAt.slice(0, 10) : '0000-00-00';
  let done = 0;
  let of = 0;
  for (let i = 1; i <= days; i++) {
    const d = addDaysToKey(today, -i);
    if (d < start) break;
    of += 1;
    if (doneOn(state, questId, d)) done += 1;
  }
  return { done, of };
}
