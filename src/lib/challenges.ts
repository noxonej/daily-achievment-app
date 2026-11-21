/**
 * Challenges (B3, round 2): a host makes a 7/14/30-day challenge with fixed quests; people join from
 * a link (no account needed) and only sign in to be on its leaderboard.
 */
import { db, publicGet, publicTop } from './firebase';
import { friendsSession } from './friends';
import { asChallenge, cleanCode, fullDays, isFinished, JOIN_CODE, MAX_CHALLENGE_QUESTS, newJoinCode, ticks } from './social';
import type { Challenge, ChallengeQuest, JoinedChallenge } from './types';
import { APP_URL } from './config';

/** Reads a challenge by code (works without signing in). */
export async function fetchChallenge(raw: string): Promise<Challenge | null> {
  const code = cleanCode(raw);
  if (!JOIN_CODE.test(code)) return null;
  return asChallenge(code, await publicGet(`challenges/${code}`));
}

export interface NewChallenge {
  title: string;
  hostName: string;
  days: 7 | 14 | 30;
  start: string;
  quests: ChallengeQuest[];
  badge: string;
}

/** Creates a challenge (needs the friends sign-in). Returns it, with its code. */
export async function createChallenge(c: NewChallenge): Promise<Challenge> {
  const s = friendsSession();
  if (!s) throw new Error('Connect with Google first (You → Friends).');
  const quests = c.quests.map((q) => ({ title: q.title.trim().slice(0, 60), icon: q.icon.slice(0, 16) || '✅' })).filter((q) => q.title).slice(0, MAX_CHALLENGE_QUESTS);
  if (!c.title.trim()) throw new Error('Give the challenge a name.');
  if (!quests.length) throw new Error('Add at least one quest.');
  const api = db(s.accountId);
  for (let i = 0; i < 4; i++) {
    const code = newJoinCode();
    const data = { title: c.title.trim().slice(0, 60), host: s.me.uid, hostName: c.hostName.trim().slice(0, 40) || s.me.name, days: c.days, start: c.start, quests, badge: c.badge || '🏅' };
    try {
      await api.setStamped(`challenges/${code}`, data, 'createdAt', { create: true });
      return { code, ...data };
    } catch {
      // try another code
    }
  }
  throw new Error("Couldn't create the challenge. Try again.");
}

export interface BoardRow {
  uid: string;
  name: string;
  score: number;
  fullDays: number;
  finished: boolean;
}

/** The challenge leaderboard (public). */
export async function challengeBoard(code: string): Promise<BoardRow[]> {
  const rows = await publicTop<Record<string, unknown>>(`challenges/${code}`, 'players', 'score', 50).catch(() => []);
  return rows.flatMap((r) => {
    const d = r.data;
    if (typeof d.name !== 'string' || typeof d.score !== 'number') return [];
    return [{ uid: r.id, name: d.name.slice(0, 20), score: Math.max(0, Math.min(180, d.score)), fullDays: typeof d.fullDays === 'number' ? d.fullDays : 0, finished: d.finished === true }];
  });
}

const lastSent = new Map<string, number>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

/** Puts your score on the challenge board (only when signed in; at most every 35 s, the rules allow 30). */
export function submitScore(ch: JoinedChallenge) {
  const s = friendsSession();
  if (!s) return;
  const send = async () => {
    lastSent.set(ch.code, Date.now());
    await db(s.accountId)
      .setStamped(`challenges/${ch.code}/players/${s.me.uid}`, { name: s.me.name.split(/\s+/)[0].slice(0, 20), score: Math.min(180, ticks(ch)), fullDays: Math.min(30, fullDays(ch)), finished: isFinished(ch) }, 'at')
      .catch(() => undefined);
  };
  clearTimeout(timers.get(ch.code));
  const wait = Math.max(0, (lastSent.get(ch.code) ?? 0) + 35_000 - Date.now());
  timers.set(ch.code, setTimeout(() => void send(), wait));
}

export function challengeLink(code: string): string {
  return `${APP_URL}?challenge=${encodeURIComponent(code)}`;
}
