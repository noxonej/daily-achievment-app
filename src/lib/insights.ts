import type { DerivedStats } from './types';
import { hashString } from './hash';
import { todayKey } from './date';
import { levelFromTotalXp } from './xp';

export interface Insight {
  icon: string;
  text: string;
  tone: 'hype' | 'nudge' | 'info';
}

// Lines shown when nothing more specific applies — picked deterministically
// by the date, so it's stable within a day but varies day to day instead of
// feeling random or repeating on every render.
const GENERIC_LINES: Array<{ icon: string; text: string }> = [
  { icon: '🌱', text: 'Small quests, stacked daily, beat big ones done never.' },
  { icon: '🧭', text: "Consistency is the cheat code — you're already using it." },
  { icon: '⏳', text: 'Future-you is grateful for whatever you finish today.' },
  { icon: '🪄', text: "One quest down is momentum you can't buy." },
  { icon: '🎯', text: "Pick the quest you're avoiding — it counts for the most." },
  { icon: '🔁', text: 'Streaks are built one unremarkable day at a time.' },
];

// A lightweight, fully local "coach" — no AI call needed, just a priority
// list of rules over stats that are already being computed. Each rule reads
// the moment (empty board, about to tie a record, nearly leveling, perfect
// day) and reacts to it; the generic pool is only a fallback.
export function getDailyInsight(activeDailyCount: number, doneCount: number, stats: DerivedStats): Insight {
  const remaining = Math.max(0, activeDailyCount - doneCount);
  const { level, xpIntoLevel, xpForNextLevel } = levelFromTotalXp(stats.totalXp);
  const xpToLevel = xpForNextLevel - xpIntoLevel;

  if (activeDailyCount > 0 && doneCount === 0) {
    if (stats.currentStreak > 0) {
      return {
        icon: '🔥',
        tone: 'nudge',
        text: `Your ${stats.currentStreak}-day streak is waiting on you — one quest keeps it alive.`,
      };
    }
    return { icon: '🧭', tone: 'nudge', text: 'Fresh board. Start with your easiest quest to get moving.' };
  }

  if (activeDailyCount > 0 && remaining === 0) {
    const wouldBeRecord = stats.longestStreak > 0 && stats.currentStreak + 1 > stats.longestStreak;
    return {
      icon: '✨',
      tone: 'hype',
      text: wouldBeRecord
        ? `Perfect day! That locks in a new ${stats.currentStreak + 1}-day record.`
        : 'Perfect day! Every quest cleared — nice work.',
    };
  }

  if (xpToLevel <= 25) {
    return { icon: '⚡', tone: 'hype', text: `Only ${xpToLevel} XP to level ${level + 1} — one more quest might do it.` };
  }

  if (stats.longestStreak > 0 && stats.currentStreak === stats.longestStreak && remaining > 0) {
    return {
      icon: '🏆',
      tone: 'nudge',
      text: `You're tying your best streak (${stats.longestStreak}d) — finish today to beat it.`,
    };
  }

  if (remaining === 1) {
    return { icon: '🪄', tone: 'nudge', text: 'One quest left for a perfect day.' };
  }

  const line = GENERIC_LINES[hashString(todayKey()) % GENERIC_LINES.length];
  return { icon: line.icon, tone: 'info', text: line.text };
}
