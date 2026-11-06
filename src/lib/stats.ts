import type { AppState, DayLog, DerivedStats } from './types';
import { addDaysToKey, daysBetween, todayKey } from './date';
import { levelFromTotalXp } from './xp';
import { findItem, paidFor } from '../data/avatar';

/** A day keeps the streak going if at least one quest was finished (or skipped with a Skip Pass), like Duolingo. */
export function dayCountsForStreak(log: DayLog | undefined): boolean {
  return !!log && log.completedQuestIds.length > 0;
}

function computeStreaks(dayLogs: Record<string, DayLog>, shielded: Set<string> = new Set()): { current: number; longest: number } {
  // Days saved by a Streak Shield count toward the streak (not toward perfect days).
  const keys = Array.from(new Set([...Object.keys(dayLogs), ...shielded])).sort();

  let longest = 0;
  let run = 0;
  let prevKey: string | null = null;
  for (const k of keys) {
    const log = dayLogs[k];
    const isPerfect = shielded.has(k) || dayCountsForStreak(log);
    if (isPerfect) {
      run = prevKey && daysBetween(prevKey, k) === 1 ? run + 1 : 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
    prevKey = k;
  }

  let current = 0;
  let cursor = todayKey();
  let firstIteration = true;
  // Today is given a pass if nothing is done yet (day still in progress);
  // any earlier day with nothing done breaks the chain.
  while (true) {
    const log = dayLogs[cursor];
    const isPerfect = shielded.has(cursor) || dayCountsForStreak(log);
    if (isPerfect) {
      current += 1;
      cursor = addDaysToKey(cursor, -1);
      firstIteration = false;
    } else if (firstIteration) {
      cursor = addDaysToKey(cursor, -1);
      firstIteration = false;
    } else {
      break;
    }
  }

  return { current, longest };
}

export function computeDerivedStats(state: AppState): DerivedStats {
  const dayLogsArr = Object.values(state.dayLogs);
  const weekLogsArr = Object.values(state.weekLogs);

  const totalXp =
    dayLogsArr.reduce((s, l) => s + l.xpEarned, 0) + weekLogsArr.reduce((s, l) => s + l.xpEarned, 0);
  const totalQuestsCompleted =
    dayLogsArr.reduce((s, l) => s + l.completedQuestIds.length - (l.skipped?.length ?? 0), 0) +
    weekLogsArr.reduce((s, l) => s + l.completedQuestIds.length, 0);
  const totalPerfectDays = dayLogsArr.filter((l) => l.perfectDay && l.dailyQuestCount > 0).length;
  const daysActive = dayLogsArr.filter((l) => l.completedQuestIds.length > 0).length;
  const goalsCompleted = state.goals.filter((g) => !!g.completedAt).length;
  const { level } = levelFromTotalXp(totalXp);
  const { current, longest } = computeStreaks(state.dayLogs, new Set(state.shieldedDates ?? []));
  // Items that no longer exist cost nothing, so shards spent on retired items are refunded automatically.
  const shardsSpent = (state.unlockedCosmeticIds ?? []).reduce((sum, id) => sum + paidFor(findItem(id), state.purchases?.[id]), 0);
  const availableShards = Math.max(0, totalXp + (state.bonusShards ?? 0) - shardsSpent);
  const perfectWeeks = weekLogsArr.filter((l) => l.perfectWeek && l.weeklyQuestCount > 0).length;
  const chestsEarned = totalPerfectDays + perfectWeeks + (level - 1) + (state.bonusChests ?? 0);
  const chestsAvailable = Math.max(0, chestsEarned - (state.chestsOpened ?? 0));

  return {
    totalXp,
    level,
    currentStreak: current,
    longestStreak: longest,
    totalQuestsCompleted,
    totalPerfectDays,
    goalsCompleted,
    daysActive,
    availableShards,
    chestsEarned,
    chestsAvailable,
  };
}
