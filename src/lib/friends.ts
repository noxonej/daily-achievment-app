import { useEffect, useRef, useSyncExternalStore } from 'react';
import { plausibleWeekXp } from './fairPlay';
import { safePicture } from './url';
import type { AppState, Sharing } from './types';
import { db, friendsConfigured, friendsSignIn, clearSession, loadSession } from './firebase';
import { addDaysToKey, todayKey, weekKey, parseKey } from './date';
import { showSystemNotification } from './notify';
import { ACHIEVEMENTS } from '../data/achievements';
import { rankForLevel } from './ranks';

/* ---------------------------------------------------------------- types */

export interface FriendProfile {
  uid: string;
  name: string;
  code: string;
  look?: string;
  level?: number;
  streak?: number;
  weekXp?: number;
  week?: string;
  picture?: string;
  /** Days with at least one finished quest in the last 30 days, comma separated (for duo streaks). */
  active?: string;
  updatedAt?: number;
}

export type ActivityKind = 'quest' | 'run' | 'streak' | 'level' | 'perfect' | 'badge';

export interface ActivityItem {
  id: string;
  uid: string;
  kind: ActivityKind;
  text: string;
  icon: string;
  value?: number;
  at: number;
}

export interface Cheer {
  id: string;
  fromUid: string;
  fromName: string;
  text: string;
  at: number;
}

export interface FriendRequest {
  uid: string;
  name: string;
  code: string;
  at: number;
}

export interface FriendsState {
  status: 'off' | 'signed-out' | 'loading' | 'ready' | 'error';
  error?: string;
  me?: FriendProfile;
  friends: FriendProfile[];
  requests: FriendRequest[];
  feed: ActivityItem[];
  cheers: Cheer[];
  toasts: Array<{ id: string; icon: string; text: string; look?: string; leaving?: boolean }>;
  global?: GlobalPlayer[];
  rarity?: RealRarity;
}

export const DEFAULT_SHARING: Sharing = { quests: true, runs: true, streak: true, level: true, badges: true, global: false };

export interface GlobalPlayer {
  uid: string;
  name: string;
  level: number;
  weekXp: number;
  look?: string;
}

/** Real numbers from everyone who connected: how many players, and how many are at your rank or higher. */
export interface RealRarity {
  players: number;
  atOrAbove: number;
  startLevel: number;
  day: string;
}

/* ---------------------------------------------------------------- store */

let current: FriendsState = { status: 'off', friends: [], requests: [], feed: [], cheers: [], toasts: [] };
const listeners = new Set<() => void>();
function set(patch: Partial<FriendsState>) {
  current = { ...current, ...patch };
  listeners.forEach((l) => l());
}

export function useFriends(): FriendsState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}

export function dismissFriendToast(id: string) {
  // Mark it as leaving first so it can slide away, then remove it.
  if (!current.toasts.some((t) => t.id === id && !t.leaving)) return;
  set({ toasts: current.toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t)) });
  setTimeout(() => set({ toasts: current.toasts.filter((t) => t.id !== id) }), 300);
}

function toast(icon: string, text: string, look?: string) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  set({ toasts: [...current.toasts, { id, icon, text, look }].slice(-3) });
  setTimeout(() => dismissFriendToast(id), 5000);
  if (document.visibilityState === 'hidden') showSystemNotification('Squzo friends', text, `friends-${id}`);
}

/* ---------------------------------------------------------------- helpers */

const str = (v: unknown, max = 500): string | undefined => (typeof v === 'string' ? v.slice(0, max) : undefined);
const clamp = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(n) || 0));
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

const KINDS: ActivityKind[] = ['quest', 'run', 'streak', 'level', 'perfect', 'badge'];

function asActivity(id: string, uid: string, raw: unknown): ActivityItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const kind = KINDS.find((k) => k === r.kind);
  const text = str(r.text, 200);
  const at = num(r.at);
  if (!kind || text === undefined || at === undefined) return null;
  return { id, uid, kind, text, icon: str(r.icon, 32) ?? '✅', value: num(r.value), at };
}

function asCheer(id: string, raw: unknown): Cheer | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const fromUid = str(r.fromUid, 128);
  const text = str(r.text, 200);
  if (!fromUid || text === undefined) return null;
  return { id, fromUid, fromName: str(r.fromName, 40) ?? 'A friend', text, at: num(r.at) ?? 0 };
}

function asRequest(uid: string, raw: unknown): FriendRequest | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const name = str(r.name, 40);
  if (name === undefined) return null;
  return { uid, name, code: str(r.code, 12) ?? '', at: num(r.at) ?? 0 };
}

function asPlayer(uid: string, raw: unknown): GlobalPlayer | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const name = str(r.name, 40);
  if (name === undefined) return null;
  return { uid, name, level: num(r.level) ?? 0, weekXp: num(r.weekXp) ?? 0, look: str(r.look, 4000) };
}

/** A profile read from the cloud, checked field by field (anything odd is dropped), or null. */
function asProfile(raw: unknown): Omit<FriendProfile, 'uid'> | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const name = str(r.name, 40);
  const code = str(r.code, 12);
  if (name === undefined || code === undefined) return null;
  return {
    name,
    code,
    look: str(r.look, 4000),
    level: num(r.level),
    streak: num(r.streak),
    weekXp: num(r.weekXp),
    week: str(r.week, 12),
    picture: safePicture(r.picture),
    active: str(r.active, 400),
    updatedAt: num(r.updatedAt),
  };
}

const seenKey = (acc: string) => `dayforge-friends-seen-${acc}`;
const outboxKey = (acc: string) => `dayforge-outbox-${acc}`;
const INVITE_KEY = 'dayforge-invite';

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
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    // nothing else to do
  }
}

/** Remembers a friend's invite code from the link (?invite=CODE) until friends are connected. */
export function rememberInvite(code: string) {
  writeJson(INVITE_KEY, code.toUpperCase());
}

export function inviteLink(code: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}?invite=${encodeURIComponent(code)}`;
}

function makeCode(name: string): string {
  const letters = (name.normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase() || 'DAY').slice(0, 4).padEnd(3, 'X');
  return `${letters}-${String(Math.floor(1000 + Math.random() * 9000))}`;
}

export function weekXp(state: AppState): number {
  const monday = addDaysToKey(todayKey(), -((parseKey(todayKey()).getDay() + 6) % 7));
  const days = Object.values(state.dayLogs).filter((l) => l.date >= monday).reduce((s, l) => s + (l.xpEarned ?? 0), 0);
  return days + (state.weekLogs[weekKey()]?.xpEarned ?? 0);
}

/** The last 30 days you finished a quest on (or protected with a shield), as "2026-11-12,2026-11-11,…". */
export function activeDays(state: AppState): string {
  const shielded = new Set(state.shieldedDates ?? []);
  const out: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = addDaysToKey(todayKey(), -i);
    if (shielded.has(d) || (state.dayLogs[d]?.completedQuestIds.length ?? 0) > 0) out.push(d);
  }
  return out.join(',');
}

/**
 * A duo streak: days in a row where you AND your friend both finished at least one quest.
 * Today counts once you've both done one; until then it doesn't break the streak.
 */
export function duoStreak(mine: string, theirs: string | undefined): { days: number; meToday: boolean; themToday: boolean } {
  const a = new Set(mine.split(',').filter(Boolean));
  const b = new Set((theirs ?? '').split(',').filter(Boolean));
  const today = todayKey();
  let days = 0;
  for (let i = 0; i < 30; i++) {
    const d = addDaysToKey(today, -i);
    if (a.has(d) && b.has(d)) days += 1;
    else if (i > 0) break;
  }
  return { days, meToday: a.has(today), themToday: b.has(today) };
}

/* ---------------------------------------------------------------- actions */

interface Ctx {
  accountId: string;
  name: string;
  picture?: string;
  state: AppState;
  level: number;
  streak: number;
}

let ctxRef: Ctx | null = null;
/** The account connected to Squzo's cloud right now (null when signed out of friends). */
export const connectedAccountId = (): string | null => (ctxRef && loadSession(ctxRef.accountId) ? ctxRef.accountId : null);
let syncing = false;

const codeDocKey = (acc: string) => `dayforge-code-doc-${acc}`;

/**
 * Friend codes live in codes/{code} → { uid }, so finding a friend is a single read by id and nobody
 * can list everyone's profile. Claims a new code (creating codes/{code} only if it's free) or makes
 * sure the code you already have is registered there (one-time migration for older accounts).
 */
/**
 * Makes sure profiles/{uid}.code and codes/{code} agree (A6: the rules only let you claim the code that
 * is already in your own profile). Order: write the profile with the code first, then claim the code.
 * When the code changes, the old codes/{code} doc is removed so codes can't pile up.
 */
async function ensureCodeAndProfile(ctx: Ctx, existing: Omit<FriendProfile, 'uid'> | null, build: (code: string) => Omit<FriendProfile, 'uid'>): Promise<Omit<FriendProfile, 'uid'>> {
  const api = db(ctx.accountId);
  const uid = api.uid();
  const registered = readJson<string | null>(codeDocKey(ctx.accountId), null);
  const save = async (p: Omit<FriendProfile, 'uid'>) => {
    const changed =
      !existing ||
      (['name', 'code', 'look', 'level', 'streak', 'weekXp', 'week', 'picture', 'active'] as const).some(
        (k) => (existing as Record<string, unknown>)[k] !== (p as Record<string, unknown>)[k],
      );
    if (changed) await api.set(`profiles/${uid}`, p as never);
    existing = p;
  };
  const done = async (p: Omit<FriendProfile, 'uid'>) => {
    writeJson(codeDocKey(ctx.accountId), p.code);
    if (registered && registered !== p.code) await api.remove(`codes/${registered}`).catch(() => undefined);
    return p;
  };

  const have = existing?.code && FRIEND_CODE.test(existing.code) ? existing.code : undefined;
  if (have) {
    const p = build(have);
    if (registered === have) {
      await save(p);
      return p;
    }
    // If the database can't be asked right now (offline, or its rules not updated yet), keep the
    // code as it is and try again on the next refresh.
    const doc = await api.get<{ uid?: unknown }>(`codes/${have}`).catch(() => 'later' as const);
    if (doc === 'later') {
      await save(p);
      return p;
    }
    if (doc?.uid === uid) {
      await save(p);
      return done(p);
    }
    if (!doc) {
      await save(p);
      if (await api.create(`codes/${have}`, { uid })) return done(p);
    }
    // Someone else owns this code (it could happen before codes were checked): get a new one.
  }
  for (let i = 0; i < 6; i++) {
    const c = makeCode(ctx.name);
    const taken = await api.get<{ uid?: unknown }>(`codes/${c}`).catch(() => ({ uid: 'unknown' }));
    if (taken) continue;
    const p = build(c);
    await save(p);
    if (await api.create(`codes/${c}`, { uid })) return done(p);
  }
  // Couldn't register one right now: keep what the profile has; the next refresh tries again.
  const p = build(have ?? makeCode(ctx.name));
  await save(p);
  return p;
}

const FRIEND_CODE = /^[A-Z]{3,4}-[0-9]{4}$/;

/** Exported for tests. */
export async function ensureProfile(ctx: Ctx): Promise<FriendProfile> {
  const api = db(ctx.accountId);
  const uid = api.uid();
  const existing = asProfile(await api.get(`profiles/${uid}`));
  const share = { ...DEFAULT_SHARING, ...(ctx.state.sharing ?? {}) };
  const build = (code: string): Omit<FriendProfile, 'uid'> => ({
    name: ctx.name.trim().slice(0, 40) || 'Player',
    code,
    look: JSON.stringify(ctx.state.character),
    // Kept inside the limits the database accepts (firestore.rules).
    level: share.level ? clamp(ctx.level, 200) : 0,
    streak: share.streak ? clamp(ctx.streak, 3650) : 0,
    weekXp: share.quests ? clamp(weekXp(ctx.state), 50000) : 0,
    week: weekKey(),
    active: share.streak ? activeDays(ctx.state) : '',
    ...(safePicture(ctx.picture) ? { picture: safePicture(ctx.picture) } : {}),
    updatedAt: Date.now(),
  });
  const profile = await ensureCodeAndProfile(ctx, existing, build);
  return { uid, ...profile };
}

/** Public weekly board (only people who turned it on) and real rank rarity, refreshed at most every 10 minutes. */
let globalAt = 0;
let onBoard: boolean | null = null;
async function syncGlobal(ctx: Ctx, me: FriendProfile) {
  const api = db(ctx.accountId);
  const share = { ...DEFAULT_SHARING, ...(ctx.state.sharing ?? {}) };
  const path = `boards/${weekKey()}/players/${me.uid}`;
  if (share.global) {
    const first = ctx.name.trim().split(/\s+/)[0]?.slice(0, 16) || 'Player';
    await api.set(path, { name: first, level: clamp(ctx.level, 200), weekXp: clamp(weekXp(ctx.state), 50000), look: JSON.stringify(ctx.state.character), at: Date.now() });
    onBoard = true;
  } else if (onBoard !== false) {
    await api.remove(path).catch(() => undefined);
    onBoard = false;
  }
  if (Date.now() - globalAt < 10 * 60_000 && current.global) return;
  globalAt = Date.now();
  const rows = await api.query<unknown>(`boards/${weekKey()}`, 'players', { orderBy: 'weekXp', limit: 50 }).catch(() => []);
  // Fair play (A7): hide numbers that aren't possible for that level / day, and anyone you reported.
  const hidden = new Set(readJson<string[]>(reportedKey(ctx.accountId), []));
  const global = rows
    .flatMap((r) => asPlayer(r.id, r.data) ?? [])
    .filter((p) => p.uid === me.uid || (!hidden.has(p.uid) && plausibleWeekXp(p.level, p.weekXp)));
  const startLevel = rankForLevel(ctx.level).startLevel;
  const cacheKey = `dayforge-rarity-${ctx.accountId}`;
  let rarity = readJson<RealRarity | null>(cacheKey, null);
  if (!rarity || rarity.day !== todayKey() || rarity.startLevel !== startLevel) {
    // Counted on this week's public board (people who chose to be on it): profiles can't be listed.
    const board = `boards/${weekKey()}`;
    const [players, atOrAbove] = await Promise.all([
      api.count(board, 'players', ['level', 'GREATER_THAN', 0]),
      api.count(board, 'players', ['level', 'GREATER_THAN_OR_EQUAL', Math.max(1, startLevel)]),
    ]).catch(() => [0, 0]);
    if (players > 0) {
      rarity = { players, atOrAbove, startLevel, day: todayKey() };
      writeJson(cacheKey, rarity);
    }
  }
  set({ global, rarity: rarity ?? undefined });
}

/** Pulls friends, requests, the feed and cheers; shows a toast for anything new. */
export async function refreshFriends(): Promise<void> {
  const ctx = ctxRef;
  if (!ctx || syncing) return;
  if (!friendsConfigured()) return set({ status: 'off' });
  if (!loadSession(ctx.accountId)) return set({ status: 'signed-out' });
  syncing = true;
  if (current.status !== 'ready') set({ status: 'loading' });
  try {
    await flushOutbox(ctx.accountId, true);
    const api = db(ctx.accountId);
    const me = await ensureProfile(ctx);
    const [reqDocs, friendDocs, cheerDocs] = await Promise.all([
      api.query<unknown>(`requests/${me.uid}`, 'from'),
      api.query<unknown>(`friends/${me.uid}`, 'list'),
      api.query<unknown>(`cheers/${me.uid}`, 'items', { orderBy: 'at', limit: 20 }),
    ]);
    const ids = friendDocs.map((d) => d.id);
    const profiles = (await Promise.all(ids.map((id) => api.get(`profiles/${id}`).then(asProfile)))).flatMap((p, i) =>
      p ? [{ uid: ids[i], ...p, weekXp: p.week === weekKey() ? (p.weekXp ?? 0) : 0 }] : [],
    );
    const feedLists = await Promise.all(
      ids.map((id) =>
        api
          .query<unknown>(`activity/${id}`, 'items', { orderBy: 'at', limit: 8 })
          .then((rows) => rows.flatMap((r) => asActivity(r.id, id, r.data) ?? []))
          .catch(() => [] as ActivityItem[]),
      ),
    );
    const feed = feedLists.flat().sort((a, b) => b.at - a.at).slice(0, 40);
    const requests = reqDocs.flatMap((d) => asRequest(d.id, d.data) ?? []).filter((r) => !isBlocked(r.uid));
    const cheers = cheerDocs.flatMap((d) => asCheer(d.id, d.data) ?? []);

    // Toasts for news since last time (the very first sync just sets the starting point).
    const seen = readJson<{ feed: number; cheers: number; requests: string[] } | null>(seenKey(ctx.accountId), null);
    if (seen) {
      const byUid = new Map(profiles.map((p) => [p.uid, p]));
      feed.filter((f) => f.at > seen.feed).slice(0, 3).reverse().forEach((f) => {
        const p = byUid.get(f.uid);
        if (p) toast(f.icon, `${p.name}: ${f.text}`, p.look);
      });
      cheers.filter((c) => c.at > seen.cheers).slice(0, 2).forEach((c) => toast('👏', `${c.fromName} cheered: ${c.text}`));
      requests.filter((r) => !seen.requests.includes(r.uid)).forEach((r) => toast('🤝', `${r.name} wants to be friends`));
    }
    writeJson(seenKey(ctx.accountId), {
      feed: Math.max(seen?.feed ?? 0, feed[0]?.at ?? 0),
      cheers: Math.max(seen?.cheers ?? 0, cheers[0]?.at ?? 0),
      requests: requests.map((r) => r.uid),
    });

    set({ status: 'ready', error: undefined, me, friends: profiles, requests, feed, cheers });
    await syncGlobal(ctx, me).catch(() => undefined);

    // A friend's invite link opened before connecting: send them a request now.
    const invite = readJson<string | null>(INVITE_KEY, null);
    if (invite) {
      localStorage.removeItem(INVITE_KEY);
      if (invite !== me.code && !profiles.some((p) => p.code === invite)) {
        await addFriendByCode(invite).catch(() => undefined);
      }
    }
  } catch (e) {
    set({ status: current.me ? 'ready' : 'error', error: e instanceof Error ? e.message : 'Something went wrong.' });
  } finally {
    syncing = false;
  }
}

/** Connects this account to friends (Google window). */
export async function connectFriends(accountId: string, hint?: string) {
  await friendsSignIn(accountId, hint);
  // Anything that happened before connecting isn't sent; sharing starts now.
  writeJson(outboxKey(accountId), []);
  await refreshFriends();
}

export function disconnectFriends(accountId: string) {
  clearSession(accountId);
  set({ status: 'signed-out', me: undefined, friends: [], requests: [], feed: [], cheers: [] });
}

export async function addFriendByCode(raw: string): Promise<string> {
  const ctx = ctxRef;
  const me = current.me;
  if (!ctx || !me) throw new Error('Connect first.');
  const code = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (!/^[A-Z]{3,4}-\d{4}$/.test(code)) throw new Error('Codes look like TOM-4821.');
  if (code === me.code) throw new Error("That's your own code.");
  const api = db(ctx.accountId);
  const link = await api.get<{ uid?: unknown }>(`codes/${code}`);
  const theirUid = typeof link?.uid === 'string' ? link.uid : '';
  const profile = theirUid ? asProfile(await api.get(`profiles/${theirUid}`)) : null;
  if (!profile) throw new Error('Nobody has that code. Check it and try again.');
  const them = { id: theirUid, data: profile };
  if (current.friends.some((f) => f.uid === them.id)) throw new Error(`${them.data.name} is already your friend.`);
  // They already asked you? Then this is just accepting.
  if (current.requests.some((r) => r.uid === them.id)) {
    await acceptRequest(them.id);
    return `You and ${them.data.name} are now friends!`;
  }
  await api.setStamped(`requests/${them.id}/from/${me.uid}`, { name: me.name.slice(0, 40), code: me.code, at: Date.now() }, 'createdAt');
  return `Request sent to ${them.data.name}.`;
}

export async function acceptRequest(fromUid: string) {
  const ctx = ctxRef;
  const me = current.me;
  if (!ctx || !me) return;
  const api = db(ctx.accountId);
  const at = Date.now();
  await api.set(`friends/${me.uid}/list/${fromUid}`, { at });
  await api.set(`friends/${fromUid}/list/${me.uid}`, { at });
  await api.remove(`requests/${me.uid}/from/${fromUid}`);
  await refreshFriends();
}

export async function declineRequest(fromUid: string) {
  const ctx = ctxRef;
  const me = current.me;
  if (!ctx || !me) return;
  await db(ctx.accountId).remove(`requests/${me.uid}/from/${fromUid}`);
  set({ requests: current.requests.filter((r) => r.uid !== fromUid) });
}

const blockedKey = (acc: string) => `dayforge-blocked-${acc}`;

/** Blocks someone: removes the friendship and any request, and they can't send new requests or cheers. */
export async function blockUser(uid: string) {
  const ctx = ctxRef;
  const me = current.me;
  if (!ctx || !me || uid === me.uid) return;
  const list = readJson<string[]>(blockedKey(ctx.accountId), []);
  if (!list.includes(uid)) writeJson(blockedKey(ctx.accountId), [...list, uid].slice(-500));
  const api = db(ctx.accountId);
  await api.set(`blocks/${me.uid}/list/${uid}`, { at: Date.now() });
  await api.remove(`requests/${me.uid}/from/${uid}`).catch(() => undefined);
  if (current.friends.some((f) => f.uid === uid)) await removeFriend(uid);
  set({ requests: current.requests.filter((r) => r.uid !== uid) });
}

export function isBlocked(uid: string): boolean {
  return !!ctxRef && readJson<string[]>(blockedKey(ctxRef.accountId), []).includes(uid);
}

export async function removeFriend(uid: string) {
  const ctx = ctxRef;
  const me = current.me;
  if (!ctx || !me) return;
  const api = db(ctx.accountId);
  await api.remove(`friends/${me.uid}/list/${uid}`);
  await api.remove(`friends/${uid}/list/${me.uid}`).catch(() => undefined);
  set({ friends: current.friends.filter((f) => f.uid !== uid), feed: current.feed.filter((f) => f.uid !== uid) });
}

const reportedKey = (acc: string) => `dayforge-reported-${acc}`;

/**
 * Reports a leaderboard player as cheating: hides them on this phone right away and leaves a note
 * (reports/{them}/from/{me}) that only the admin can read.
 */
export async function reportPlayer(uid: string) {
  const ctx = ctxRef;
  const me = current.me;
  if (!ctx || !me || uid === me.uid) return;
  const list = readJson<string[]>(reportedKey(ctx.accountId), []);
  if (!list.includes(uid)) writeJson(reportedKey(ctx.accountId), [...list, uid].slice(-200));
  const player = (current.global ?? []).find((p) => p.uid === uid);
  set({ global: (current.global ?? []).filter((p) => p.uid !== uid) });
  await db(ctx.accountId)
    .setStamped(`reports/${uid}/from/${me.uid}`, { week: weekKey(), weekXp: clamp(player?.weekXp ?? 0, 1000000), level: clamp(player?.level ?? 0, 1000) }, 'at')
    .catch(() => undefined);
}

const cheeredKey = (acc: string) => `dayforge-cheered-${acc}`;

export function hasCheered(itemId: string): boolean {
  return !!ctxRef && readJson<string[]>(cheeredKey(ctxRef.accountId), []).includes(itemId);
}

export async function cheer(item: ActivityItem) {
  const ctx = ctxRef;
  const me = current.me;
  if (!ctx || !me) return;
  const done = readJson<string[]>(cheeredKey(ctx.accountId), []);
  if (done.includes(item.id)) return;
  writeJson(cheeredKey(ctx.accountId), [...done, item.id].slice(-300));
  set({ feed: [...current.feed] });
  // One cheer per friend per item (A8): the id says who cheered what, and the rules allow it once.
  await db(ctx.accountId).create(`cheers/${item.uid}/items/${me.uid}_${item.id}`, { fromUid: me.uid, fromName: me.name.slice(0, 40), text: item.text.slice(0, 200), at: Date.now() });
}

/* ---------------------------------------------------------------- outbox */

interface Outgoing {
  key: string;
  kind: ActivityKind;
  text: string;
  icon: string;
  value?: number;
  at: number;
  /** Sent after this time, so a quest ticked by mistake and unticked isn't shared. */
  due: number;
}

function enqueue(accountId: string, items: Outgoing[]) {
  if (!items.length || !loadSession(accountId)) return;
  const box = readJson<Outgoing[]>(outboxKey(accountId), []);
  writeJson(outboxKey(accountId), [...box.filter((b) => !items.some((i) => i.key === b.key)), ...items].slice(-50));
}

function unqueue(accountId: string, keys: string[]) {
  const box = readJson<Outgoing[]>(outboxKey(accountId), []);
  writeJson(outboxKey(accountId), box.filter((b) => !keys.includes(b.key)));
}

async function flushOutbox(accountId: string, all = false) {
  const box = readJson<Outgoing[]>(outboxKey(accountId), []);
  const now = Date.now();
  const ready = box.filter((b) => all || b.due <= now).filter((b) => b.due <= now);
  if (!ready.length || !loadSession(accountId)) return;
  const api = db(accountId);
  const uid = api.uid();
  for (const b of ready) {
    try {
      await api.add(`activity/${uid}/items`, { kind: b.kind, text: b.text.slice(0, 200), icon: b.icon.slice(0, 32), ...(b.value !== undefined ? { value: b.value } : {}), at: b.at });
    } catch (e) {
      // Refused by the rules (e.g. older than a week after being offline): drop it instead of retrying forever.
      if (!(e instanceof Error && e.message === 'Not allowed.')) throw e;
    }
    unqueue(accountId, [b.key]);
  }  // Keep the leaderboard card (XP, streak, level) in step with what was just shared.
  if (ctxRef?.accountId === accountId) await ensureProfile(ctxRef).catch(() => undefined);
}

/* ---------------------------------------------------------------- hooks */

interface Snapshot {
  today: string;
  day: Set<string>;
  week: Set<string>;
  runs: number;
  level: number;
  perfect: boolean;
  badges: Set<string>;
  streakPop?: string;
}

function snapshot(state: AppState, level: number): Snapshot {
  const t = todayKey();
  const log = state.dayLogs[t];
  const skipped = new Set(log?.skipped ?? []);
  return {
    today: t,
    day: new Set((log?.completedQuestIds ?? []).filter((id) => !skipped.has(id))),
    week: new Set(state.weekLogs[weekKey()]?.completedQuestIds ?? []),
    runs: (state.runs ?? []).length,
    level,
    perfect: !!log?.perfectDay,
    badges: new Set(state.unlockedAchievements.map((a) => a.id)),
    streakPop: state.streakPopDate,
  };
}

/**
 * Runs inside the app: keeps the friends data fresh (every minute while open) and shares what
 * you do (quests, runs, streaks, levels, badges) as it happens, if you're connected.
 */
export function useFriendsEngine(opts: { accountId: string | null; name: string; picture?: string; state: AppState; level: number; streak: number }) {
  const { accountId, state, level, streak } = opts;
  ctxRef = accountId ? { accountId, name: opts.name, picture: opts.picture, state, level, streak } : null;
  const prev = useRef<Snapshot | null>(null);

  // Start / poll.
  useEffect(() => {
    if (!accountId) return;
    void refreshFriends();
    const tick = () => document.visibilityState === 'visible' && refreshFriends();
    const t = setInterval(tick, 60_000);
    const flush = setInterval(() => void flushOutbox(accountId).catch(() => undefined), 5_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(t);
      clearInterval(flush);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [accountId]);

  // Detect things worth sharing.
  useEffect(() => {
    if (!accountId) return;
    const next = snapshot(state, level);
    const before = prev.current;
    prev.current = next;
    if (!before || before.today !== next.today || !loadSession(accountId)) return;
    const share = { ...DEFAULT_SHARING, ...(state.sharing ?? {}) };
    const now = Date.now();
    const out: Outgoing[] = [];
    const swaps = state.dayLogs[next.today]?.swaps ?? {};
    const title = (id: string) => swaps[id]?.title ?? state.quests.find((q) => q.id === id)?.title;
    const icon = (id: string) => swaps[id]?.icon ?? state.quests.find((q) => q.id === id)?.icon ?? '✅';
    if (share.quests) {
      for (const id of next.day) if (!before.day.has(id) && title(id)) out.push({ key: `q:${next.today}:${id}`, kind: 'quest', text: `Finished “${title(id)}”`, icon: icon(id), at: now, due: now + 20_000 });
      for (const id of next.week) if (!before.week.has(id) && title(id)) out.push({ key: `w:${weekKey()}:${id}`, kind: 'quest', text: `Finished the weekly quest “${title(id)}”`, icon: icon(id), at: now, due: now + 20_000 });
      // Unticked within 20 seconds: don't share it after all.
      const undone = [...before.day].filter((id) => !next.day.has(id)).map((id) => `q:${next.today}:${id}`);
      if (undone.length) unqueue(accountId, undone);
      if (!before.perfect && next.perfect) out.push({ key: `p:${next.today}`, kind: 'perfect', text: 'Had a perfect day', icon: '✨', at: now, due: now + 20_000 });
    }
    if (share.runs && next.runs > before.runs) {
      const run = state.runs[state.runs.length - 1];
      if (run) out.push({ key: `r:${run.id}`, kind: 'run', text: `Ran ${run.km.toFixed(1)} km`, icon: '🏃', value: run.km, at: now, due: now });
    }
    if (share.level && next.level > before.level) out.push({ key: `l:${next.level}`, kind: 'level', text: `Reached level ${next.level}`, icon: '⭐', value: next.level, at: now, due: now });
    if (share.streak && next.streakPop === next.today && before.streakPop !== next.today && streak >= 2)
      out.push({ key: `s:${next.today}`, kind: 'streak', text: `${streak} day streak`, icon: '🔥', value: streak, at: now, due: now });
    if (share.badges) {
      for (const id of next.badges)
        if (!before.badges.has(id)) {
          const a = ACHIEVEMENTS.find((x) => x.id === id);
          if (a) out.push({ key: `b:${id}`, kind: 'badge', text: `Unlocked the badge “${a.title}”`, icon: a.icon, at: now, due: now });
        }
    }
    enqueue(accountId, out);
  }, [accountId, state, level, streak]);
}
