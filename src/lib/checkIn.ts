import type { AppState } from './types';
import { addDaysToKey } from './date';

/**
 * Daily rewards: open the app and claim one reward a day, on a 7-day track that ends in a prize chest.
 * Kind on purpose: missing a day never takes progress away, you just carry on from where you were.
 * Claiming all 7 on 7 days in a row adds a "perfect week" bonus, so there's a reason to come back daily.
 */
export type CheckInReward =
  | { kind: 'shards'; amount: number }
  | { kind: 'swap' }
  | { kind: 'shield' }
  | { kind: 'chest' };

export const CHECKIN_REWARDS: CheckInReward[] = [
  { kind: 'shards', amount: 10 },
  { kind: 'shards', amount: 15 },
  { kind: 'swap' },
  { kind: 'shards', amount: 25 },
  { kind: 'shield' },
  { kind: 'shards', amount: 40 },
  { kind: 'chest' },
];

export const PERFECT_WEEK_BONUS = 50;

export function checkInRewardInfo(r: CheckInReward): { icon: string; short: string; title: string } {
  switch (r.kind) {
    case 'shards':
      return { icon: '💎', short: String(r.amount), title: `${r.amount} shards` };
    case 'swap':
      return { icon: '🔁', short: 'Swap', title: 'A Quest Swap' };
    case 'shield':
      return { icon: '🛡', short: 'Shield', title: 'A Streak Shield' };
    case 'chest':
      return { icon: 'df:chest', short: 'Chest', title: 'A prize chest' };
  }
}

export interface CheckInView {
  claimedToday: boolean;
  /** Days ticked off on the track right now (0–7). */
  filled: number;
  /** The day (1–7) you can claim now, or tomorrow if today is done. */
  nextDay: number;
  /** Claims in a row so far in this week of rewards (for the perfect-week bonus). */
  inARow: number;
  /** Whether the perfect-week bonus is still possible this week. */
  perfectPossible: boolean;
}

export function checkInView(state: Pick<AppState, 'checkIn'>, today: string): CheckInView {
  const c = state.checkIn;
  if (c && c.last === today) {
    return { claimedToday: true, filled: c.day, nextDay: c.day < 7 ? c.day + 1 : 1, inARow: c.inARow, perfectPossible: c.inARow === c.day };
  }
  // After a full week of rewards, a new one starts.
  const filled = c && c.day < 7 ? c.day : 0;
  const keepsRow = !!c && filled > 0 && c.last === addDaysToKey(today, -1);
  const inARow = filled === 0 ? 0 : keepsRow ? c.inARow : 0;
  return { claimedToday: false, filled, nextDay: filled + 1, inARow, perfectPossible: filled === 0 || (keepsRow && c.inARow === filled) };
}

/** The new check-in record after claiming today, plus what it gives. */
export function claimCheckIn(state: Pick<AppState, 'checkIn'>, today: string) {
  const v = checkInView(state, today);
  if (v.claimedToday) return null;
  const day = v.nextDay;
  const inARow = v.inARow + 1;
  const reward = CHECKIN_REWARDS[day - 1];
  const perfectBonus = day === 7 && inARow === 7 ? PERFECT_WEEK_BONUS : 0;
  return { record: { day, last: today, inARow }, reward, perfectBonus };
}
