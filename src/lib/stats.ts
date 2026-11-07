import type { AppState, DayLog, DerivedStats } from './types';
import { addDaysToKey, daysBetween, todayKey } from './date';
import { levelFromTotalXp } from './xp';
import { findItem, paidFor } from '../data/avatar';

/** A day keeps the streak going if at least one quest was finished (or skipped with a Skip Pass), like Duolingo. */
export function dayCountsForStreak(log: DayLog | undefined): boolean {
  return !!log && log.completedQuestIds.length > 0;
}

/**
 * Grace days ("rest days"): to reward consistency rather than perfection, one missed day in any
 * 7 keeps the streak alive. It doesn't add to the count, it just doesn't break it. A miss only
 * counts as a rest day when the day after it was active again (or is today, still in progress).
 */
export function graceDays(dayLogs: Record<string, DayLog>, shielded: Set<string> = new Set(), today: string = todayKey()): Set<string> {
  const good = (k: string) => shielded.has(k) || dayCountsForStreak(dayLogs[k]);
  const keys = Object.keys(dayLogs).filter((k) => dayCountsForStreak(dayLogs[k])).sort();
  const grace = new Set<string>();
  if (!keys.length) return grace;
  let lastGrace: string | null = null;
  for (let d = addDaysToKey(keys[0], 1); d < today; d = addDaysToKey(d, 1)) {
    if (good(d)) continue;
    const before = addDaysToKey(d, -1);
    const after = addDaysToKey(d, 1);
    const chainBefore = good(before) || grace.has(before);
    const resumed = after === today || good(after);
    const rested = !lastGrace || daysBetween(lastGrace, d) >= 7;
    if (chainBefore && resumed && rested) {
      grace.add(d);
      lastGrace = d;
    }
  }
  return grace;
}

function computeStreaks(dayLogs: Record<string, DayLog>, shielded: Set<string> = new Set(), grace: Set<string> = new Set()): { current: number; longest: number } {
  const today = todayKey();
  const good = (k: string) => shielded.has(k) || dayCountsForStreak(dayLogs[k]);
  const keys = Object.keys(dayLogs).concat([...shielded]).sort();

  // Longest: walk every day from the first one; rest days keep a run going without adding to it.
  let longest = 0;
  let run = 0;
  if (keys.length) {
    for (let d = keys[0]; d <= today; d = addDaysToKey(d, 1)) {
      if (good(d)) {
        run += 1;
        longest = Math.max(longest, run);
      } else if (grace.has(d) || d === today) {
        // today is still in progress
      } else {
        run = 0;
      }
    }
  }

  // Current: count back from today. Today gets a pass while nothing is done yet.
  let current = 0;
  let cursor = today;
  let first = true;
  for (let guard = 0; guard < 4000; guard++) {
    if (good(cursor)) current += 1;
    else if (first || grace.has(cursor)) {
      // keep going
    } else break;
    first = false;
    cursor = addDaysToKey(cursor, -1);
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
  const shielded = new Set(state.shieldedDates ?? []);
  const grace = graceDays(state.dayLogs, shielded);
  const { current, longest } = computeStreaks(state.dayLogs, shielded, grace);
  // Consistency this week (Monday to today), shown instead of only the all-or-nothing streak.
  const today = todayKey();
  const dow = (new Date().getDay() + 6) % 7;
  let activeThisWeek = 0;
  for (let i = 0; i <= dow; i++) if (dayCountsForStreak(state.dayLogs[addDaysToKey(today, -i)]) || shielded.has(addDaysToKey(today, -i))) activeThisWeek += 1;
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
    activeThisWeek,
    graceDates: [...grace],
  };
}
