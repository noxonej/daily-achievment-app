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

/** Your rank name (Rookie I … Squzo Legend); see ranks.ts. */
export function titleForLevel(level: number): string {
  return rankForLevel(level).name;
}

export const DIFFICULTY_XP: Record<string, number> = {
  easy: 10,
  medium: 20,
  hard: 35,
  epic: 60,
};

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
