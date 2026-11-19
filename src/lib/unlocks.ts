import type { AppState } from './types';
import { daysBetween, todayKey } from './date';

/**
 * Simple mode opens the app up slowly, so a new player isn't hit with everything at once.
 * Day 1 shows Today, Goals and You. World comes on day 2, Money on day 4 and the Coach on day 7.
 * Nothing is deleted or hidden for good: turning Simple mode off, tapping "Show all tabs now" in
 * Settings, or opening a tab from a link unlocks it right away. Older accounts see everything.
 */
export const UNLOCK_DAY: Partial<Record<string, number>> = { world: 2, money: 4, coach: 7 };

/** Which day of using the app this is: 1 on the day the account was made. */
export function appDay(state: AppState, today: string = todayKey()): number {
  const made = state.createdAt ? new Date(state.createdAt) : null;
  if (!made || Number.isNaN(made.getTime())) return 999;
  const start = todayKey(made);
  return Math.max(1, daysBetween(start, today) + 1);
}

export function tabUnlocked(state: AppState, tab: string, today: string = todayKey()): boolean {
  const day = UNLOCK_DAY[tab];
  if (day === undefined) return true;
  if (state.prefs?.simple === false) return true;
  const guide = state.guide ?? [];
  if (guide.includes('tabs:all') || guide.includes(`visit:${tab}`)) return true;
  return appDay(state, today) >= day;
}

/** A tab that just opened up and hasn't been looked at yet gets a small "New" tag (new accounts only). */
export function tabIsNew(state: AppState, tab: string, today: string = todayKey()): boolean {
  if (UNLOCK_DAY[tab] === undefined || state.prefs?.simple === false) return false;
  if (appDay(state, today) > 14) return false;
  const guide = state.guide ?? [];
  return tabUnlocked(state, tab, today) && !guide.includes(`visit:${tab}`) && !guide.includes('tabs:all');
}

/** True while some tab is still waiting to unlock. */
export function someTabsLocked(state: AppState, today: string = todayKey()): boolean {
  return ['world', 'money'].some((t) => !tabUnlocked(state, t, today));
}
