/**
 * Daily XP cap per quest type (B8, round 2). A quest's type is its main IRL stat (Body, Mind, Wealth,
 * Discipline, Social). Each type can earn at most DAILY_TYPE_CAP XP a day from quests, so making 30
 * "epic" custom quests doesn't farm the leaderboard. Normal days never get close: all the starter
 * quests of one type add up to ~105 XP. Only today is computed this way; past days never change.
 */
import { questStats, type StatId } from './irlStats';
import type { Quest } from './types';

export const DAILY_TYPE_CAP = 300;

/** Sums quest XP with the per-type cap. `lost` is how much XP the cap held back. */
export function cappedXp(items: Array<{ quest: Pick<Quest, 'category' | 'title' | 'stats'>; xp: number }>, cap = DAILY_TYPE_CAP): { xp: number; lost: number } {
  const byType = new Map<StatId, number>();
  for (const { quest, xp } of items) {
    const type = questStats(quest)[0];
    byType.set(type, (byType.get(type) ?? 0) + xp);
  }
  let xp = 0;
  let lost = 0;
  for (const sum of byType.values()) {
    xp += Math.min(cap, sum);
    lost += Math.max(0, sum - cap);
  }
  return { xp, lost };
}
