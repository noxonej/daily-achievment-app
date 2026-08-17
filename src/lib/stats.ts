import type { AppState, DayLog, DerivedStats } from './types';
import { addDaysToKey, daysBetween, todayKey } from './date';
import { levelFromTotalXp } from './xp';
import { findCosmetic } from '../data/cosmetics';

function computeStreaks(dayLogs: Record<string, DayLog>): { current: number; longest: number } {
  const keys = Object.keys(dayLogs).sort();

  let longest = 0;
  let run = 0;
  let prevKey: string | null = null;
  for (const k of keys) {
    const log = dayLogs[k];
    const isPerfect = log.perfectDay && log.dailyQuestCount > 0;
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
  // Today is given a pass if it isn't perfect yet (day still in progress);
  // any earlier day that isn't perfect breaks the chain.
  while (true) {
    const log = dayLogs[cursor];
    const isPerfect = !!log && log.perfectDay && log.dailyQuestCount > 0;
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
    dayLogsArr.reduce((s, l) => s + l.completedQuestIds.length, 0) +
    weekLogsArr.reduce((s, l) => s + l.completedQuestIds.length, 0);
  const totalPerfectDays = dayLogsArr.filter((l) => l.perfectDay && l.dailyQuestCount > 0).length;
  const daysActive = dayLogsArr.filter((l) => l.completedQuestIds.length > 0).length;
  const goalsCompleted = state.goals.filter((g) => !!g.completedAt).length;
  const { level } = levelFromTotalXp(totalXp);
  const { current, longest } = computeStreaks(state.dayLogs);
  const shardsSpent = state.unlockedCosmeticIds.reduce((sum, id) => sum + (findCosmetic(id)?.cost ?? 0), 0);
  const availableShards = Math.max(0, totalXp - shardsSpent);

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
  };
}
