/**
 * Invite rewards (B6, round 2). Your friend opens your invite link (?invite=CODE) and connects with
 * Google. After they've really used Squzo on 3 different days, you both get a reward:
 *  - you (the inviter): INVITE_COINS coins per friend, for up to MAX_INVITE_REWARDS friends, and the
 *    exclusive Squad Cap (first time only);
 *  - your friend: the same exclusive cap.
 *
 * Anti-farm (see firestore.rules → invites): each account can name one inviter, once, forever; the
 * day counter only takes the server's date, once per day; the docs can't be deleted and re-made; and
 * rewards stop after MAX_INVITE_REWARDS friends.
 */
import { useEffect, useRef } from 'react';
import { db, loadSession } from './firebase';
import { friendsSession, toast } from './friends';
import { L } from './lang';
import { todayKey } from './date';
import type { AppState } from './types';

export const INVITE_DAYS = 3;
export const INVITE_COINS = 150;
export const MAX_INVITE_REWARDS = 10;
/** The exclusive cosmetic (src/data/avatar.ts, unlock kind 'invite'). */
export const INVITE_ITEM = 'hw-squadcap';
/** Gift id for the invited friend's own reward (state.gifts). */
export const INVITED_GIFT = 'invited-3-days';

const PENDING_KEY = 'dayforge-invite-reward';
const mineKey = (acc: string) => `dayforge-invited-${acc}`;

/** The server's day number (same formula as serverDay() in the rules). */
export const dayNumber = (ms = Date.now()) => Math.floor(ms / 86400000);

export interface InviteRow {
  friend: string;
  name: string;
  days: number;
  claimed: boolean;
}

/** Rows that can be paid out now, respecting the lifetime cap (already-paid friends count too). */
export function rewardable(rows: InviteRow[], paid: string[]): InviteRow[] {
  const left = Math.max(0, MAX_INVITE_REWARDS - paid.length);
  return rows.filter((r) => r.days >= INVITE_DAYS && !r.claimed && !paid.includes(r.friend)).slice(0, left);
}

/** Your active day: at least one real quest or task ticked today. */
export function activeToday(state: AppState): boolean {
  const log = state.dayLogs[todayKey()];
  return !!log && (log.completedQuestIds.length > 0 || (log.quickTasks ?? []).some((t) => t.done));
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, v: unknown) {
  try {
    if (v === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(v));
  } catch {
    // private mode: try again next time
  }
}

/** Called when the app opens from an invite link (kept until you connect). */
export function rememberInviteReward(code: string) {
  writeJson(PENDING_KEY, code.trim().toUpperCase().slice(0, 12));
}

interface Mine {
  by: string;
  days: number;
  last: number;
}

/** Saves who invited you (once ever) and starts your day counter. */
async function recordInviter(accountId: string, uid: string, name: string, code: string): Promise<void> {
  const api = db(accountId);
  const owner = await api.get<{ uid?: unknown }>(`codes/${code}`);
  const by = typeof owner?.uid === 'string' ? owner.uid : '';
  writeJson(PENDING_KEY, null);
  if (!by || by === uid) return;
  const already = await api.get<{ by?: unknown }>(`invitedBy/${uid}`);
  if (already) {
    // Someone invited you before (maybe on another phone): keep counting for them.
    if (typeof already.by === 'string') writeJson(mineKey(accountId), { by: already.by, days: 0, last: -1 });
    return;
  }
  if (!(await api.create(`invitedBy/${uid}`, { by }))) return;
  await api.create(`invites/${by}/from/${uid}`, { name: name.trim().split(/\s+/)[0]?.slice(0, 40) || 'Friend', days: [], claimed: false });
  writeJson(mineKey(accountId), { by, days: 0, last: -1 });
}

/** Adds today to your counter (once a day). Returns true on the day you reach INVITE_DAYS. */
async function markActiveDay(accountId: string, uid: string): Promise<boolean> {
  const mine = readJson<Mine | null>(mineKey(accountId), null);
  const today = dayNumber();
  if (!mine || mine.days >= INVITE_DAYS || mine.last === today) return false;
  const api = db(accountId);
  const path = `invites/${mine.by}/from/${uid}`;
  const doc = await api.get<{ days?: unknown }>(path);
  if (!doc) {
    writeJson(mineKey(accountId), null);
    return false;
  }
  const days = Array.isArray(doc.days) ? doc.days.map(Number) : [];
  if (days.length < INVITE_DAYS && !days.includes(today)) {
    await api.patch(path, { days: [...days, today] });
    days.push(today);
  }
  writeJson(mineKey(accountId), { ...mine, days: days.length, last: today });
  return days.length >= INVITE_DAYS;
}

/** Your invited friends, with their day counts. */
export async function myInvites(accountId: string, uid: string): Promise<InviteRow[]> {
  const rows = await db(accountId).query<{ name?: unknown; days?: unknown; claimed?: unknown }>(`invites/${uid}`, 'from');
  return rows.map((r) => ({
    friend: r.id,
    name: typeof r.data.name === 'string' && r.data.name ? r.data.name : 'Friend',
    days: Array.isArray(r.data.days) ? r.data.days.length : 0,
    claimed: r.data.claimed === true,
  }));
}

export type InviteDispatch = (a: { type: 'INVITE_REWARD'; friend?: string; name?: string }) => void;

/** Runs the invite loop while you're connected to Squzo's cloud. */
export function useInviteEngine(accountId: string | null, state: AppState, dispatch: InviteDispatch) {
  const latest = useRef({ state, dispatch });
  latest.current = { state, dispatch };
  const busy = useRef(false);
  const active = activeToday(state);

  useEffect(() => {
    if (!accountId) return;
    const run = async () => {
      const s = friendsSession();
      if (busy.current || !s || s.accountId !== accountId || !loadSession(accountId)) return;
      busy.current = true;
      try {
        const { state: st, dispatch: send } = latest.current;
        const pending = readJson<string | null>(PENDING_KEY, null);
        if (pending) await recordInviter(accountId, s.me.uid, s.name, pending).catch(() => undefined);
        if (activeToday(st) && (await markActiveDay(accountId, s.me.uid).catch(() => false)) && !(st.gifts ?? []).includes(INVITED_GIFT)) {
          send({ type: 'INVITE_REWARD' });
          toast('🧢', L('3 days in! You unlocked the exclusive Squad cap.', '3 dienos! Atrakinai išskirtinę Būrio kepurę.'));
        }
        const paid = st.invite?.claimed ?? [];
        for (const r of rewardable(await myInvites(accountId, s.me.uid).catch(() => []), paid)) {
          // Claimed on the server first, so the same friend can't pay out on two phones. Already
          // claimed (filtered out above) means it was paid on another phone or before a reset.
          const ok = await db(accountId).patch(`invites/${s.me.uid}/from/${r.friend}`, { claimed: true }).then(() => true, () => false);
          if (!ok) continue;
          send({ type: 'INVITE_REWARD', friend: r.friend, name: r.name });
          toast('🎁', L(`${r.name} stayed 3 days: +${INVITE_COINS} coins for you!`, `${r.name} išbuvo 3 dienas: +${INVITE_COINS} monetų tau!`));
        }
      } finally {
        busy.current = false;
      }
    };
    const first = setTimeout(() => void run(), 4000);
    const t = setInterval(() => document.visibilityState === 'visible' && void run(), 5 * 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [accountId, active]);
}
