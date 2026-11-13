import type { AppState } from './types';
import { todayKey } from './date';

/**
 * Seasons: every calendar month is a season with its own name and a reward track. You earn
 * season points from what you already do (1 per quest, +3 for a perfect day), and claim each
 * tier's prize before the month ends. Gold gives a trophy that only exists for that month.
 */
export interface SeasonTheme {
  name: string;
  icon: string;
  color: string;
}

const THEMES: SeasonTheme[] = [
  { name: 'Fresh Start', icon: '🌱', color: '#86efac' },
  { name: 'Iron Will', icon: '🛡', color: '#cbd5e1' },
  { name: 'Spring Sprint', icon: '⚡', color: '#fde047' },
  { name: 'Bloom', icon: '✨', color: '#f9a8d4' },
  { name: 'Momentum', icon: '🚀', color: '#93c5fd' },
  { name: 'Sun Grind', icon: '☀', color: '#fdba74' },
  { name: 'Heatwave', icon: '🔥', color: '#fb923c' },
  { name: 'Deep Focus', icon: '🎯', color: '#a5b4fc' },
  { name: 'Back to Work', icon: '📚', color: '#fcd34d' },
  { name: 'Night Shift', icon: '🌙', color: '#c4b5fd' },
  { name: 'Hunter', icon: '🎯', color: '#fca5a5' },
  { name: 'Legend Run', icon: '👑', color: '#fde68a' },
];

export interface SeasonTier {
  points: number;
  label: string;
  reward: { coins: number; chest?: boolean; trophy?: boolean };
}

export const SEASON_TIERS: SeasonTier[] = [
  { points: 30, label: 'Bronze', reward: { coins: 100 } },
  { points: 80, label: 'Silver', reward: { coins: 200, chest: true } },
  { points: 150, label: 'Gold', reward: { coins: 400, chest: true, trophy: true } },
];

/** "2026-11" */
export const seasonKey = (date: string = todayKey()) => date.slice(0, 7);

export function seasonTheme(key: string = seasonKey()): SeasonTheme {
  return THEMES[Number(key.slice(5, 7)) - 1] ?? THEMES[0];
}

export function seasonLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const month = new Date(y, m - 1, 1).toLocaleString(undefined, { month: 'long' });
  return `${seasonTheme(key).name} · ${month} ${y}`;
}

export function seasonPoints(state: AppState, key: string = seasonKey()): number {
  let pts = 0;
  for (const [date, log] of Object.entries(state.dayLogs)) {
    if (!date.startsWith(key)) continue;
    pts += log.completedQuestIds.length - (log.skipped?.length ?? 0);
    if (log.perfectDay && log.dailyQuestCount > 0) pts += 3;
  }
  return pts;
}

export function daysLeftInSeason(today: string = todayKey()): number {
  const [y, m, d] = today.split('-').map(Number);
  return new Date(y, m, 0).getDate() - d + 1;
}

export function claimedTiers(state: AppState, key: string = seasonKey()): number[] {
  return state.seasonClaims?.[key] ?? [];
}
