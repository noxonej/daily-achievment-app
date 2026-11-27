import type { AppState, CarMods, DerivedStats, PlacedDecor, ShowcasePrefs, WorldState } from './types';
import { ACHIEVEMENTS } from '../data/achievements';
import { TIER_ORDER } from './achievementTiers';
import {
  DECOR,
  GARAGE_ENVS,
  GARAGE_UPGRADES,
  PARTS,
  PROPERTIES,
  TROPHIES,
  VEHICLES,
  garageEnvOf,
  garageUpgradesOf,
  ownedVehicles,
  owns,
  partsOf,
  trophiesEarned,
  vehicleHex,
  worldOf,
} from '../world/catalog';
import { MAX_PLACED, isMovable, layoutOf } from '../world/room/layout';

/**
 * Profile showcase (2026-11-27). One small document per player, showcase/{uid}, that friends (or
 * everyone, if you choose) can open by id: your character, level and XP, real milestones, the
 * badges you picked, and, if you leave them on, your room, garage and vehicle collection.
 *
 * Everything in it comes from real progress, never from purchases alone, and it is checked field
 * by field when it is read, so a broken or hand-made document can't show anything odd.
 */

export const DEFAULT_SHOWCASE: ShowcasePrefs = { who: 'friends', room: true, garage: true, stats: true, collection: true };

export function showcasePrefs(state: Pick<AppState, 'showcase'>): ShowcasePrefs {
  return { ...DEFAULT_SHOWCASE, ...(state.showcase ?? {}) };
}

/** The document as stored (all plain fields, so firestore.rules can check each one). */
export interface ShowcaseDoc {
  name: string;
  who: 'friends' | 'everyone';
  look?: string;
  level?: number;
  xp?: number;
  streak?: number;
  best?: number;
  quests?: number;
  perfect?: number;
  badges?: number;
  /** Featured badge ids, comma separated. */
  featured?: string;
  /** JSON: { p, d, t, l } (see encodeRoom). */
  room?: string;
  /** JSON: { e, v, h, m, u, t } (see encodeGarage). */
  garage?: string;
  /** Owned vehicle ids, comma separated. */
  cars?: string;
  at?: number;
}

/** What a visitor sees, after checking. */
export interface Showcase {
  uid: string;
  name: string;
  look?: string;
  level: number;
  xp?: number;
  streak?: number;
  best?: number;
  quests?: number;
  perfect?: number;
  badges?: number;
  featured: string[];
  room?: { world: WorldState };
  garage?: { world: WorldState; env: string; vehicle: string | null; hex?: string; parts?: CarMods; upgrades: Set<string>; trophies: Set<string> };
  cars?: string[];
  at?: number;
}

/* ---------------------------------------------------------------- picking badges */

const tierRank = (id: string) => TIER_ORDER.indexOf(ACHIEVEMENTS.find((a) => a.id === id)?.tier ?? 'bronze');

/** Your featured badges: the ones you picked, else your three best (highest tier, newest first). */
export function featuredBadges(state: Pick<AppState, 'showcase' | 'unlockedAchievements'>): string[] {
  const earned = state.unlockedAchievements.filter((a) => ACHIEVEMENTS.some((x) => x.id === a.id));
  const ids = new Set(earned.map((a) => a.id));
  const picked = (state.showcase?.featured ?? []).filter((id) => ids.has(id)).slice(0, 3);
  if (picked.length) return picked;
  return [...earned]
    .sort((a, b) => tierRank(b.id) - tierRank(a.id) || String(b.unlockedAt ?? '').localeCompare(String(a.unlockedAt ?? '')))
    .slice(0, 3)
    .map((a) => a.id);
}

/* ---------------------------------------------------------------- encoding */

const HEX = /^#[0-9a-fA-F]{6}$/;
const clampN = (v: unknown, lo: number, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(Math.min(hi, Math.max(lo, v))) : undefined);

export function encodeRoom(world: WorldState): string {
  const fixed: Record<string, string> = {};
  for (const [slot, id] of Object.entries(world.decor)) if (id && !isMovable(slot as never)) fixed[slot] = id;
  const layout = layoutOf(world)
    .slice(0, MAX_PLACED)
    .map((p) => (p.s ? [p.id, Math.round(p.x), Math.round(p.y), p.s] : [p.id, Math.round(p.x), Math.round(p.y)]));
  return JSON.stringify({ p: world.property, d: fixed, t: world.tints ?? {}, l: layout });
}

export function decodeRoom(raw: unknown): WorldState | null {
  let o: Record<string, unknown>;
  try {
    o = typeof raw === 'string' ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
  if (!o || typeof o !== 'object') return null;
  const property = PROPERTIES.find((p) => p.id === o.p)?.id;
  if (!property) return null;
  const decor: WorldState['decor'] = {};
  if (o.d && typeof o.d === 'object')
    for (const [slot, id] of Object.entries(o.d as Record<string, unknown>)) {
      const item = DECOR.find((x) => x.id === id && x.slot === slot);
      if (item && !isMovable(item.slot)) decor[item.slot] = item.id;
    }
  const tints: WorldState['tints'] = {};
  const t = (o.t ?? {}) as Record<string, unknown>;
  if (typeof t.wall === 'string' && HEX.test(t.wall)) tints.wall = t.wall;
  if (typeof t.floor === 'string' && HEX.test(t.floor)) tints.floor = t.floor;
  const layout: PlacedDecor[] = [];
  if (Array.isArray(o.l))
    for (const row of o.l.slice(0, MAX_PLACED)) {
      if (!Array.isArray(row)) continue;
      const item = DECOR.find((x) => x.id === row[0]);
      const x = clampN(row[1], 0, 1200);
      const y = clampN(row[2], 0, 560);
      if (!item || !isMovable(item.slot) || item.model === 'none' || x === undefined || y === undefined) continue;
      const s = row[3] === 's' || row[3] === 'l' || row[3] === 'm' ? row[3] : undefined;
      layout.push({ uid: `v${layout.length}`, id: item.id, x, y, ...(s ? { s } : {}) });
    }
  return { property, decor, paid: {}, tints, layout };
}

export function encodeGarage(world: WorldState, stats: DerivedStats): string {
  const owned = ownedVehicles(world);
  const v = owned.find((x) => x.id === world.vehicle) ?? owned[0] ?? null;
  return JSON.stringify({
    e: garageEnvOf(world).id,
    v: v?.id ?? null,
    h: v ? vehicleHex(world, v) : undefined,
    m: v ? partsOf(world, v) : undefined,
    u: [...garageUpgradesOf(world)],
    t: [...trophiesEarned(stats)],
  });
}

export function decodeGarage(raw: unknown): Showcase['garage'] | null {
  let o: Record<string, unknown>;
  try {
    o = typeof raw === 'string' ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
  if (!o || typeof o !== 'object') return null;
  const env = GARAGE_ENVS.find((g) => g.id === o.e)?.id ?? 'gx-lockup';
  const vehicle = VEHICLES.find((v) => v.id === o.v)?.id ?? null;
  const hex = typeof o.h === 'string' && HEX.test(o.h) ? o.h : undefined;
  const parts: CarMods = {};
  if (o.m && typeof o.m === 'object')
    for (const [kind, value] of Object.entries(o.m as Record<string, unknown>)) {
      const part = PARTS.find((p) => p.kind === kind && p.value === value);
      if (part) (parts as Record<string, string>)[part.kind] = part.value;
    }
  const list = (v: unknown, known: Array<{ id: string }>) => new Set((Array.isArray(v) ? v : []).filter((id): id is string => known.some((k) => k.id === id)));
  const upgrades = list(o.u, GARAGE_UPGRADES);
  const trophies = list(o.t, TROPHIES);
  const world: WorldState = { property: 'room', decor: {}, paid: Object.fromEntries([...upgrades].map((id) => [id, 1])), garage: env, vehicle: vehicle ?? undefined };
  return { world, env, vehicle, hex, parts, upgrades, trophies };
}

const ids = (raw: unknown, known: Array<{ id: string }>, max: number) =>
  typeof raw === 'string' ? raw.split(',').filter((id) => known.some((k) => k.id === id)).slice(0, max) : [];

/** Your own showcase document, built from your real progress and what you chose to show. */
export function buildShowcase(state: AppState, stats: DerivedStats, name: string, preview = false): ShowcaseDoc | null {
  const prefs = showcasePrefs(state);
  if (prefs.who === 'nobody' && !preview) return null;
  const world = worldOf(state);
  const doc: ShowcaseDoc = {
    name: name.trim().slice(0, 40) || 'Player',
    who: prefs.who === 'everyone' ? 'everyone' : 'friends',
    look: JSON.stringify(state.character ?? {}).slice(0, 4000),
    level: Math.min(200, stats.level),
    xp: Math.min(100_000_000, Math.round(stats.totalXp)),
    badges: Math.min(500, state.unlockedAchievements.length),
    featured: featuredBadges(state).join(','),
    at: Date.now(),
  };
  if (prefs.stats) {
    doc.streak = Math.min(3650, stats.currentStreak);
    doc.best = Math.min(3650, stats.longestStreak);
    doc.quests = Math.min(1_000_000, stats.totalQuestsCompleted);
    doc.perfect = Math.min(100_000, stats.totalPerfectDays);
  }
  if (prefs.room) doc.room = encodeRoom(world).slice(0, 8000);
  if (prefs.garage) doc.garage = encodeGarage(world, stats);
  if (prefs.collection) doc.cars = VEHICLES.filter((v) => owns(world, v.id)).map((v) => v.id).join(',').slice(0, 1500);
  return doc;
}

/** A showcase read from the cloud, checked field by field. */
export function parseShowcase(uid: string, raw: unknown): Showcase | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.name !== 'string' || !r.name.trim()) return null;
  const room = r.room !== undefined ? decodeRoom(r.room) : null;
  const garage = r.garage !== undefined ? decodeGarage(r.garage) : null;
  return {
    uid,
    name: r.name.slice(0, 40),
    look: typeof r.look === 'string' && r.look.length <= 4000 ? r.look : undefined,
    level: clampN(r.level, 1, 200) ?? 1,
    xp: clampN(r.xp, 0, 100_000_000),
    streak: clampN(r.streak, 0, 3650),
    best: clampN(r.best, 0, 3650),
    quests: clampN(r.quests, 0, 1_000_000),
    perfect: clampN(r.perfect, 0, 100_000),
    badges: clampN(r.badges, 0, 500),
    featured: ids(r.featured, ACHIEVEMENTS, 3),
    room: room ? { world: room } : undefined,
    garage: garage ?? undefined,
    cars: r.cars !== undefined ? ids(r.cars, VEHICLES, 200) : undefined,
    at: clampN(r.at, 0, 4102444800000),
  };
}

/** Your own showcase as a visitor would see it (for the preview, without the cloud). */
export function ownShowcase(state: AppState, stats: DerivedStats, name: string): Showcase | null {
  const doc = buildShowcase(state, stats, name, true);
  return doc ? parseShowcase('me', doc) : null;
}
