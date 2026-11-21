/**
 * Fair play on the public leaderboard (A7, round 2).
 *
 * The database rules allow up to 50,000 weekly XP (an extreme but possible week). This file hides
 * players whose numbers don't add up for *their* level and the day of the week, so a cheater can't
 * simply sit at #1. It runs on each phone: honest players never notice it.
 */
import { xpForLevel } from './xp';

/** Total XP needed to reach `level` from level 1. */
export function xpToReach(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpForLevel(l);
  return total;
}

/** A very busy real day: ~20 quests incl. hard/epic ones, crits, a 2× box and bonuses. */
export const MAX_REAL_DAY_XP = 3000;

/** Days of this (Monday-based) week that have started, 1–7. */
export function daysIntoWeek(now = new Date()): number {
  return ((now.getDay() + 6) % 7) + 1;
}

/**
 * True when this week's XP is possible: no more than a very busy day for every day so far, and no
 * more than the XP it takes to get one level above where they are (week XP is part of total XP).
 */
export function plausibleWeekXp(level: number, weekXp: number, now = new Date()): boolean {
  if (!Number.isFinite(weekXp) || weekXp < 0) return false;
  if (!Number.isFinite(level) || level < 1) return weekXp === 0;
  if (weekXp > daysIntoWeek(now) * MAX_REAL_DAY_XP) return false;
  return weekXp <= xpToReach(Math.floor(level) + 1);
}
