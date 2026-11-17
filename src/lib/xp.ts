import { rankForLevel } from './ranks';
// XP required to go from level L to L+1 grows linearly, so leveling up
// takes a little more each time without becoming punishing.
export function xpForLevel(level: number): number {
  return 80 + (level - 1) * 30;
}

export function levelFromTotalXp(totalXp: number): {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
} {
  let level = 1;
  let remaining = totalXp;
  let needed = xpForLevel(level);
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = xpForLevel(level);
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: needed };
}

/** Your rank name (Bronze I … Squzo Legend); see ranks.ts. */
export function titleForLevel(level: number): string {
  return rankForLevel(level).name;
}

/** XP per quest. Raised by half on 2026-11-17 (Jonas: "more XP to get"); see migrateContent v7. */
export const DIFFICULTY_XP: Record<string, number> = {
  easy: 15,
  medium: 30,
  hard: 50,
  epic: 90,
};

/** Share of a purchase's price you get back as XP (2026-11-17: buying things also moves you forward). */
export const BUY_XP_SHARE = 0.1;

export const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  epic: 'Epic',
};

export const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  medium: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  hard: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  epic: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
};
