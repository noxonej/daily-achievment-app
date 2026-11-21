/**
 * Wealth (B2, round 2): the money side of the IRL stats.
 */
import { QUEST_LIBRARY, type LibraryQuest } from '../data/questLibrary';
import type { MoneyState, SavingsGoal } from './types';

/** The four Wealth quests: they all feed the Wealth stat. Titles match the quest library. */
export const WEALTH_PACK_TITLES = ['Spend nothing today', 'Save something today, even 1', 'Stay under my daily limit', 'Learn one money lesson'];

export function wealthPack(): LibraryQuest[] {
  return WEALTH_PACK_TITLES.map((t) => QUEST_LIBRARY.find((q) => q.title === t)).filter((q): q is LibraryQuest => !!q);
}

const VEHICLE_ICONS = ['🚗', '🏎', '🏎️', '🚙', '🏍', '🏍️', '🛵', '🚲', '🛴', '🚘'];
const VEHICLE_WORDS = /\b(car|auto|automobil\w*|ma[sš]in\w*|motor\w*|moto|bike|scooter|paspirtuk\w*|dvira[tč]\w*|vehicle|bmw|audi|tesla|golf)\b/i;

/** Money saved for a goal: what's in its savings account (capped at the target for the bar). */
export function goalSaved(m: MoneyState, g: SavingsGoal): number {
  return Math.max(0, m.accounts.find((a) => a.id === g.accountId)?.amount ?? 0);
}

/** Your real-life car (or bike / scooter) fund, if you have one: shown in the Garage. */
export function vehicleGoal(m: MoneyState | undefined): SavingsGoal | null {
  if (!m) return null;
  return m.goals.find((g) => VEHICLE_ICONS.includes(g.icon) || VEHICLE_WORDS.test(g.name)) ?? null;
}

/** 0–1 progress of a goal. */
export function goalShare(m: MoneyState, g: SavingsGoal): number {
  return g.target > 0 ? Math.min(1, goalSaved(m, g) / g.target) : 0;
}
