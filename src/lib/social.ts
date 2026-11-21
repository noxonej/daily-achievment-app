/**
 * Squads and challenges (B3, round 2): the pure logic, kept apart from the network code so it can be
 * tested. Network code: src/lib/squads.ts and src/lib/challenges.ts.
 */
import { addDaysToKey, todayKey } from './date';
import type { Challenge, ChallengeQuest, JoinedChallenge } from './types';

export const MAX_SQUAD = 10;
export const CHALLENGE_DAYS = [7, 14, 30] as const;
export const MAX_CHALLENGE_QUESTS = 6;

/** Join codes: 8 characters without look-alikes (no 0/O, 1/I/L). Also the document id. */
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const JOIN_CODE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/;

export function newJoinCode(rand: () => number = Math.random): string {
  const bytes = new Uint8Array(8);
  if (rand === Math.random && typeof crypto !== 'undefined') crypto.getRandomValues(bytes);
  else for (let i = 0; i < 8; i++) bytes[i] = Math.floor(rand() * 256);
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
}

export function cleanCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Squad streak: days in a row where EVERY member finished at least one quest. `actives` is each
 * member's "active days" list (from their profile). Today only counts once everyone is done, and
 * doesn't break the streak until it's over.
 */
export function squadStreak(actives: string[][], today = todayKey()): { days: number; doneToday: number; total: number } {
  const sets = actives.map((a) => new Set(a));
  const all = (d: string) => sets.length > 0 && sets.every((s) => s.has(d));
  let days = 0;
  for (let i = 0; i < 30; i++) {
    const d = addDaysToKey(today, -i);
    if (all(d)) days += 1;
    else if (i > 0) break;
  }
  return { days, doneToday: sets.filter((s) => s.has(today)).length, total: sets.length };
}

/** Which day of the challenge today is (1-based), 0 before it starts, > days after it ends. */
export function challengeDay(ch: Pick<Challenge, 'start'>, today = todayKey()): number {
  const a = Date.parse(`${ch.start}T12:00:00Z`);
  const b = Date.parse(`${today}T12:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  const n = Math.round((b - a) / 86400000) + 1;
  return n < 1 ? 0 : n;
}

/** Days where every challenge quest was ticked. */
export function fullDays(ch: JoinedChallenge): number {
  return Object.values(ch.done).filter((ids) => new Set(ids).size >= ch.quests.length).length;
}

/** Total quests ticked across the challenge (the leaderboard score). */
export function ticks(ch: JoinedChallenge): number {
  return Object.values(ch.done).reduce((s, ids) => s + new Set(ids).size, 0);
}

/** Finished = every day of the challenge fully done. */
export function isFinished(ch: JoinedChallenge): boolean {
  return fullDays(ch) >= ch.days;
}

/** A challenge from the network or a link, checked field by field. null when anything's off. */
export function asChallenge(code: string, raw: unknown): Challenge | null {
  if (!raw || typeof raw !== 'object' || !JOIN_CODE.test(code)) return null;
  const r = raw as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() && v.length <= max ? v : undefined);
  const title = str(r.title, 60);
  const hostName = str(r.hostName, 40);
  const start = typeof r.start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.start) ? r.start : undefined;
  const days = CHALLENGE_DAYS.find((d) => d === r.days);
  const quests = Array.isArray(r.quests)
    ? r.quests
        .slice(0, MAX_CHALLENGE_QUESTS)
        .map((q): ChallengeQuest | null => {
          const o = (q ?? {}) as Record<string, unknown>;
          const t = str(o.title, 60);
          return t ? { title: t, icon: str(o.icon, 16) ?? '✅' } : null;
        })
        .filter((q): q is ChallengeQuest => !!q)
    : [];
  if (!title || !hostName || !start || !days || !quests.length) return null;
  return { code, title, hostName, days, start, quests, badge: str(r.badge, 16) ?? '🏅' };
}
