/**
 * Squads (B3, round 2): groups of up to 10 friends with a squad streak, a weekly squad board and a
 * squad feed. Stored in squads/{code} (see firestore.rules). Needs the friends sign-in.
 */
import { db } from './firebase';
import { friendsSession, getProfile, type ActivityItem, type FriendProfile } from './friends';
import { MAX_SQUAD, JOIN_CODE, cleanCode, newJoinCode, squadStreak } from './social';
import { weekKey } from './date';
import { APP_URL } from './config';

export interface SquadMember {
  uid: string;
  name: string;
  profile: FriendProfile | null;
  weekXp: number;
}

export interface Squad {
  code: string;
  name: string;
  owner: string;
  members: SquadMember[];
  streak: { days: number; doneToday: number; total: number };
  feed: Array<ActivityItem & { name: string }>;
}

function session() {
  const s = friendsSession();
  if (!s) throw new Error('Connect with Google first (You → Friends).');
  return s;
}

const firstName = (n: string) => n.trim().split(/\s+/)[0]?.slice(0, 40) || 'Player';

/** Makes a new squad with you in it. Returns its join code. */
export async function createSquad(name: string): Promise<string> {
  const s = session();
  const clean = name.trim().slice(0, 30);
  if (!clean) throw new Error('Give your squad a name.');
  const api = db(s.accountId);
  for (let i = 0; i < 4; i++) {
    const code = newJoinCode();
    try {
      await api.setStamped(`squads/${code}`, { name: clean, owner: s.me.uid, members: [s.me.uid], names: { [s.me.uid]: firstName(s.name) } }, 'createdAt', { create: true });
      return code;
    } catch {
      // code taken (very unlikely): try another
    }
  }
  throw new Error("Couldn't create the squad. Try again.");
}

interface SquadDoc {
  name?: unknown;
  owner?: unknown;
  members?: unknown;
  names?: unknown;
}

async function readDoc(accountId: string, code: string): Promise<{ name: string; owner: string; members: string[]; names: Record<string, string> } | null> {
  const d = await db(accountId).get<SquadDoc>(`squads/${code}`);
  if (!d) return null;
  const members = Array.isArray(d.members) ? d.members.filter((m): m is string => typeof m === 'string').slice(0, MAX_SQUAD) : [];
  const names = d.names && typeof d.names === 'object' ? Object.fromEntries(Object.entries(d.names as Record<string, unknown>).filter(([, v]) => typeof v === 'string').map(([k, v]) => [k, (v as string).slice(0, 40)])) : {};
  return { name: typeof d.name === 'string' ? d.name.slice(0, 30) : 'Squad', owner: typeof d.owner === 'string' ? d.owner : '', members, names };
}

/** Joins a squad by its code. Returns its name. */
export async function joinSquad(raw: string): Promise<{ code: string; name: string }> {
  const s = session();
  const code = cleanCode(raw);
  if (!JOIN_CODE.test(code)) throw new Error('Squad codes have 8 letters and numbers.');
  const d = await readDoc(s.accountId, code);
  if (!d) throw new Error('No squad with that code.');
  if (d.members.includes(s.me.uid)) return { code, name: d.name };
  if (d.members.length >= MAX_SQUAD) throw new Error(`This squad is full (${MAX_SQUAD} people).`);
  await db(s.accountId).patch(`squads/${code}`, { members: [...d.members, s.me.uid], names: { ...d.names, [s.me.uid]: firstName(s.name) } });
  return { code, name: d.name };
}

/** Leaves a squad (the owner can also remove someone else with `uid`). */
export async function leaveSquad(code: string, uid?: string): Promise<void> {
  const s = session();
  const d = await readDoc(s.accountId, code);
  if (!d) return;
  const who = uid ?? s.me.uid;
  const names = { ...d.names };
  if (who === s.me.uid) delete names[who];
  await db(s.accountId).patch(`squads/${code}`, { members: d.members.filter((m) => m !== who), names });
}

/** Everything the squad screen shows: members with this week's XP, the squad streak and the feed. */
export async function loadSquad(code: string): Promise<Squad | null> {
  const s = session();
  const d = await readDoc(s.accountId, code);
  if (!d || !d.members.includes(s.me.uid)) return null;
  const profiles = await Promise.all(d.members.map((uid) => (uid === s.me.uid ? Promise.resolve(s.me) : getProfile(s.accountId, uid))));
  const week = weekKey();
  const members: SquadMember[] = d.members
    .map((uid, i) => {
      const p = profiles[i];
      return { uid, name: d.names[uid] ?? p?.name ?? 'Player', profile: p, weekXp: p && p.week === week ? (p.weekXp ?? 0) : 0 };
    })
    .sort((a, b) => b.weekXp - a.weekXp);
  const streak = squadStreak(members.map((m) => (m.profile?.active ?? '').split(',').filter(Boolean)));
  const rows = await db(s.accountId)
    .query<Record<string, unknown>>(`squads/${code}`, 'feed', { orderBy: 'at', limit: 30 })
    .catch(() => []);
  const feed = rows.flatMap((r) => {
    const x = r.data;
    if (typeof x.uid !== 'string' || typeof x.text !== 'string' || typeof x.at !== 'number') return [];
    return [{ id: r.id, uid: x.uid, name: typeof x.name === 'string' ? x.name.slice(0, 40) : 'Player', kind: 'quest' as const, text: x.text.slice(0, 200), icon: typeof x.icon === 'string' ? x.icon.slice(0, 32) : '✅', at: x.at }];
  });
  return { code, name: d.name, owner: d.owner, members, streak, feed };
}

export function squadLink(code: string): string {
  return `${APP_URL}?squad=${encodeURIComponent(code)}`;
}
