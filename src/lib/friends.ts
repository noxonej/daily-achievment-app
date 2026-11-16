import { useEffect, useRef, useSyncExternalStore } from 'react';
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
  toasts: Array<{ id: string; icon: string; text: string; look?: string }>;
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
  set({ toasts: current.toasts.filter((t) => t.id !== id) });
}

function toast(icon: string, text: string, look?: string) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  set({ toasts: [...current.toasts, { id, icon, text, look }].slice(-3) });
  setTimeout(() => dismissFriendToast(id), 5000);
  if (document.visibilityState === 'hidden') showSystemNotification('Squzo friends', text, `friends-${id}`);
}

/* ---------------------------------------------------------------- helpers */

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

async function ensureProfile(ctx: Ctx): Promise<FriendProfile> {
  const api = db(ctx.accountId);
  const uid = api.uid();
  const existing = await api.get<Omit<FriendProfile, 'uid'>>(`profiles/${uid}`);
  const share = { ...DEFAULT_SHARING, ...(ctx.state.sharing ?? {}) };
  let code = existing?.code;
  for (let i = 0; !code && i < 4; i++) {
    const c = makeCode(ctx.name);
    const taken = await api.query('', 'profiles', { where: ['code', c], limit: 1 });
    if (taken.length === 0) code = c;
  }
  const profile: Omit<FriendProfile, 'uid'> = {
    name: ctx.name,
    code: code ?? makeCode(ctx.name),
    look: JSON.stringify(ctx.state.character),
    level: share.level ? ctx.level : 0,
    streak: share.streak ? ctx.streak : 0,
    weekXp: share.quests ? weekXp(ctx.state) : 0,
    week: weekKey(),
    active: share.streak ? activeDays(ctx.state) : '',
    ...(ctx.picture ? { picture: ctx.picture } : {}),
    updatedAt: Date.now(),
  };
  const changed =
    !existing ||
    (['name', 'code', 'look', 'level', 'streak', 'weekXp', 'week', 'picture', 'active'] as const).some(
      (k) => (existing as Record<string, unknown>)[k] !== (profile as Record<string, unknown>)[k],
    );
  if (changed) await api.set(`profiles/${uid}`, profile as never);
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
    await api.set(path, { name: first, level: ctx.level, weekXp: weekXp(ctx.state), look: JSON.stringify(ctx.state.character), at: Date.now() });
    onBoard = true;
  } else if (onBoard !== false) {
    await api.remove(path).catch(() => undefined);
    onBoard = false;
  }
  if (Date.now() - globalAt < 10 * 60_000 && current.global) return;
  globalAt = Date.now();
  const rows = await api.query<Omit<GlobalPlayer, 'uid'>>(`boards/${weekKey()}`, 'players', { orderBy: 'weekXp', limit: 50 }).catch(() => []);
  const global = rows.map((r) => ({ uid: r.id, ...r.data }));
  const startLevel = rankForLevel(ctx.level).startLevel;
  const cacheKey = `dayforge-rarity-${ctx.accountId}`;
  let rarity = readJson<RealRarity | null>(cacheKey, null);
  if (!rarity || rarity.day !== todayKey() || rarity.startLevel !== startLevel) {
    const [players, atOrAbove] = await Promise.all([
      api.count('profiles', ['level', 'GREATER_THAN', 0]),
      api.count('profiles', ['level', 'GREATER_THAN_OR_EQUAL', Math.max(1, startLevel)]),
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
      api.query<Omit<FriendRequest, 'uid'>>(`requests/${me.uid}`, 'from'),
      api.query<{ at: number }>(`friends/${me.uid}`, 'list'),
      api.query<Omit<Cheer, 'id'>>(`cheers/${me.uid}`, 'items', { orderBy: 'at', limit: 20 }),
    ]);
    const ids = friendDocs.map((d) => d.id);
    const profiles = (await Promise.all(ids.map((id) => api.get<Omit<FriendProfile, 'uid'>>(`profiles/${id}`)))).flatMap((p, i) =>
      p ? [{ uid: ids[i], ...p, weekXp: p.week === weekKey() ? p.weekXp : 0 }] : [],
    );
    const feedLists = await Promise.all(
      ids.map((id) =>
        api
          .query<Omit<ActivityItem, 'id' | 'uid'>>(`activity/${id}`, 'items', { orderBy: 'at', limit: 8 })
          .then((rows) => rows.map((r) => ({ id: r.id, uid: id, ...r.data })))
          .catch(() => [] as ActivityItem[]),
      ),
    );
    const feed = feedLists.flat().sort((a, b) => b.at - a.at).slice(0, 40);
    const requests = reqDocs.map((d) => ({ uid: d.id, ...d.data }));
    const cheers = cheerDocs.map((d) => ({ id: d.id, ...d.data }));

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
  const found = await api.query<Omit<FriendProfile, 'uid'>>('', 'profiles', { where: ['code', code], limit: 1 });
  if (!found.length) throw new Error('Nobody has that code. Check it and try again.');
  const them = found[0];
  if (current.friends.some((f) => f.uid === them.id)) throw new Error(`${them.data.name} is already your friend.`);
  // They already asked you? Then this is just accepting.
  if (current.requests.some((r) => r.uid === them.id)) {
    await acceptRequest(them.id);
    return `You and ${them.data.name} are now friends!`;
  }
  await api.set(`requests/${them.id}/from/${me.uid}`, { name: me.name, code: me.code, at: Date.now() });
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

export async function removeFriend(uid: string) {
  const ctx = ctxRef;
  const me = current.me;
  if (!ctx || !me) return;
  const api = db(ctx.accountId);
  await api.remove(`friends/${me.uid}/list/${uid}`);
  await api.remove(`friends/${uid}/list/${me.uid}`).catch(() => undefined);
  set({ friends: current.friends.filter((f) => f.uid !== uid), feed: current.feed.filter((f) => f.uid !== uid) });
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
  await db(ctx.accountId).add(`cheers/${item.uid}/items`, { fromUid: me.uid, fromName: me.name, text: item.text, at: Date.now() });
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
    await api.add(`activity/${uid}/items`, { kind: b.kind, text: b.text, icon: b.icon, ...(b.value !== undefined ? { value: b.value } : {}), at: b.at });
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
