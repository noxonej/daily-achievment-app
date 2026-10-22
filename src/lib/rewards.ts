import { hashString } from './hash';

// A completion has a deterministic (but unpredictable-feeling) chance of
// landing a "critical hit" for bonus XP — the variable-reward loop that
// makes habit trackers like this one addictive in a good way. It's seeded
// off (period, quest) rather than rolled with Math.random so toggling a
// quest off and back on can't be used to re-roll for a better outcome, and
// XP stays fully derivable from logs with nothing extra to persist.
const CRIT_CHANCE = 0.14;
const CRIT_BONUS_FRACTION = 0.5;

export function isCriticalHit(periodKey: string, questId: string): boolean {
  const roll = hashString(`crit:${periodKey}:${questId}`) % 100;
  return roll < Math.round(CRIT_CHANCE * 100);
}

export function questReward(periodKey: string, questId: string, baseXp: number): { xp: number; crit: boolean } {
  const crit = isCriticalHit(periodKey, questId);
  const xp = crit ? Math.round(baseXp * (1 + CRIT_BONUS_FRACTION)) : baseXp;
  return { xp, crit };
}
