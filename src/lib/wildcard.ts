import type { Quest } from './types';
import { WILDCARD_THEMES, type WildcardSeed, type WildcardTheme } from '../data/wildcardPool';
import { WEEKLY_WILDCARD_POOL } from '../data/weeklyWildcardPool';
import { DIFFICULTY_XP } from './xp';
import { hashString } from './hash';

/** How many bonus quests you can choose from each day. */
export const WILDCARD_CHOICES = 3;

function dayNumber(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return Math.floor(Date.UTC(y, (m || 1) - 1, d || 1) / 86_400_000);
}

/** Today's theme: Money Monday, Training Tuesday… (Monday = index 0). */
export function wildcardThemeFor(dateKey: string): WildcardTheme {
  // 1970-01-01 was a Thursday (index 3 with Monday first).
  const dow = (((dayNumber(dateKey) + 3) % 7) + 7) % 7;
  return WILDCARD_THEMES[dow];
}

/** A fixed shuffle of a theme's pool, so walking through it week by week rarely repeats. */
function shuffled(theme: WildcardTheme): WildcardSeed[] {
  return theme.pool
    .map((s, i) => ({ s, k: hashString(`${theme.id}|${i}|${s.title}`) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.s);
}

/**
 * The bonus quests on offer for a day: three from that day's theme. Each week moves three places
 * through the theme's pool, so with ~20 quests per theme the same one comes back about every 7 weeks.
 */
export function wildcardOptionsFor(dateKey: string): WildcardSeed[] {
  const theme = wildcardThemeFor(dateKey);
  const list = shuffled(theme);
  const week = Math.floor(dayNumber(dateKey) / 7);
  const start = (week * WILDCARD_CHOICES) % list.length;
  return Array.from({ length: Math.min(WILDCARD_CHOICES, list.length) }, (_, i) => list[(start + i) % list.length]);
}

export function buildWildcardQuestForDate(dateKey: string, pick = 0): Quest {
  const theme = wildcardThemeFor(dateKey);
  const options = wildcardOptionsFor(dateKey);
  const index = Math.max(0, Math.min(options.length - 1, Math.floor(pick) || 0));
  const seed = options[index];
  return {
    id: `wildcard-${dateKey}`,
    title: seed.title,
    description: seed.description,
    frequency: 'daily',
    difficulty: seed.difficulty,
    xp: DIFFICULTY_XP[seed.difficulty],
    icon: seed.icon,
    category: 'Wildcard',
    custom: false,
    archived: false,
    createdAt: new Date().toISOString(),
    wildcardDate: dateKey,
    wildcardPick: index,
    stats: seed.stats ?? theme.stats,
  };
}

export function buildWeeklyWildcardQuestForWeek(weekKeyValue: string): Quest {
  const seed = WEEKLY_WILDCARD_POOL[hashString(weekKeyValue) % WEEKLY_WILDCARD_POOL.length];
  return {
    id: `wildcard-week-${weekKeyValue}`,
    title: seed.title,
    description: seed.description,
    frequency: 'weekly',
    difficulty: seed.difficulty,
    xp: DIFFICULTY_XP[seed.difficulty],
    icon: seed.icon,
    category: 'Wildcard',
    custom: false,
    archived: false,
    createdAt: new Date().toISOString(),
    wildcardWeekKey: weekKeyValue,
    ...(seed.stats ? { stats: seed.stats } : {}),
  };
}
