/**
 * IRL stats (B1, round 2): Body, Mind, Wealth, Discipline, Social. Like an RPG character sheet, but
 * every point comes from something you really did.
 *
 * Nothing new is saved: stats are worked out from the history that's already in your save (finished
 * quests, runs, sleep, focus minutes, money), so existing players get theirs the moment they update.
 */
import type { AppState, Quest } from './types';
import { DIFFICULTY_XP } from './xp';

export type StatId = 'body' | 'mind' | 'wealth' | 'discipline' | 'social';

export const STAT_IDS: StatId[] = ['body', 'mind', 'wealth', 'discipline', 'social'];

export interface StatInfo {
  id: StatId;
  label: string;
  lt: string;
  icon: string;
  /** Colour for the chart and chips. */
  color: string;
  blurb: string;
}

export const STATS: Record<StatId, StatInfo> = {
  body: { id: 'body', label: 'Body', lt: 'Kūnas', icon: '💪', color: '#fb7185', blurb: 'Gym, runs, steps, sleep, food' },
  mind: { id: 'mind', label: 'Mind', lt: 'Protas', icon: '🧠', color: '#a78bfa', blurb: 'Reading, study, journaling, calm' },
  wealth: { id: 'wealth', label: 'Wealth', lt: 'Turtai', icon: '💰', color: '#34d399', blurb: 'Saving, no-spend days, budget, side hustle' },
  discipline: { id: 'discipline', label: 'Discipline', lt: 'Disciplina', icon: '⚔', color: '#fbbf24', blurb: 'Streaks, waking on time, focus sessions' },
  social: { id: 'social', label: 'Social', lt: 'Socialumas', icon: '🤝', color: '#38bdf8', blurb: 'Friends, calls, kindness, confidence' },
};

/** Which stats each quest category feeds: first one gets all the points, the second half. */
const CATEGORY_STATS: Record<string, StatId[]> = {
  body: ['body'],
  health: ['body'],
  fitness: ['body'],
  sleep: ['body', 'discipline'],
  'self-care': ['body', 'mind'],
  mind: ['mind'],
  learning: ['mind'],
  study: ['mind'],
  skills: ['mind', 'wealth'],
  creativity: ['mind'],
  finance: ['wealth'],
  money: ['wealth'],
  wealth: ['wealth'],
  hustle: ['wealth', 'discipline'],
  career: ['wealth', 'mind'],
  discipline: ['discipline'],
  life: ['discipline'],
  social: ['social'],
  confidence: ['social', 'mind'],
};

/** Words in a quest's title that tell us its stat when the category doesn't (custom quests). */
const KEYWORDS: Array<[RegExp, StatId[]]> = [
  [/gym|run|walk|steps|push.?up|squat|workout|train|stretch|swim|bike|cycl|sport|water|sleep|vegetable|protein|yoga|abs|plank|km/i, ['body']],
  [/read|book|study|learn|journal|meditat|write|course|language|lesson|podcast|think|gratitude|pages/i, ['mind']],
  [/save|saving|spend|budget|money|invest|earn|hustle|sell|client|income|no.?spend|€|\$/i, ['wealth']],
  [/wake|early|alarm|focus|cold shower|no phone|screen|discipline|routine|bed|clean|tidy|plan/i, ['discipline']],
  [/friend|call|family|mom|dad|text|talk|compliment|meet|help|volunteer|date|social/i, ['social']],
];

/** The stats a quest feeds: its own pick (custom quests), its category, or words in its title. */
export function questStats(q: Pick<Quest, 'category' | 'title'> & { stats?: StatId[] }): StatId[] {
  const own = (q.stats ?? []).filter((s): s is StatId => STAT_IDS.includes(s)).slice(0, 2);
  if (own.length) return own;
  const byCat = CATEGORY_STATS[(q.category ?? '').trim().toLowerCase()];
  if (byCat) return byCat;
  for (const [re, ids] of KEYWORDS) if (re.test(q.title ?? '')) return ids;
  return ['discipline'];
}

/** Points for level L: 10 × (L − 1)². Level 10 ≈ 810 points, 50 ≈ 24,000, 100 ≈ 98,000. */
export function statLevel(points: number): number {
  return Math.max(1, Math.min(100, Math.floor(Math.sqrt(Math.max(0, points) / 10)) + 1));
}
export function pointsForStatLevel(level: number): number {
  return 10 * (level - 1) ** 2;
}

export interface StatRank {
  name: string;
  lt: string;
  color: string;
  min: number;
}
export const STAT_RANKS: StatRank[] = [
  { name: 'Bronze', lt: 'Bronza', color: '#d08b5b', min: 1 },
  { name: 'Silver', lt: 'Sidabras', color: '#cbd5e1', min: 10 },
  { name: 'Gold', lt: 'Auksas', color: '#facc15', min: 25 },
  { name: 'Platinum', lt: 'Platina', color: '#5eead4', min: 45 },
  { name: 'Diamond', lt: 'Deimantas', color: '#7dd3fc', min: 65 },
  { name: 'Legend', lt: 'Legenda', color: '#f0abfc', min: 85 },
];
export function statRank(level: number): StatRank {
  return [...STAT_RANKS].reverse().find((r) => level >= r.min) ?? STAT_RANKS[0];
}

export interface StatValue {
  id: StatId;
  points: number;
  level: number;
  /** 0–1 progress to the next level. */
  progress: number;
  rank: StatRank;
}

export type IrlStats = Record<StatId, StatValue>;

function value(id: StatId, points: number): StatValue {
  const level = statLevel(points);
  const from = pointsForStatLevel(level);
  const to = pointsForStatLevel(level + 1);
  return { id, points: Math.round(points), level, progress: level >= 100 ? 1 : (points - from) / (to - from), rank: statRank(level) };
}

/** Points per quest finished: the quest's XP (primary stat), half of it for a second stat. */
function questPoints(q: Quest): number {
  return q.xp || DIFFICULTY_XP[q.difficulty] || 15;
}

export interface StatExtras {
  /** Friends you have (from the friends screen), for Social. */
  friends?: number;
  /** Your longest streak (from the stats), for Discipline. */
  longestStreak?: number;
}

/** Raw points per stat from everything in the save, optionally only from `since` (YYYY-MM-DD) on. */
export function statPoints(state: AppState, extras: StatExtras = {}, since?: string): Record<StatId, number> {
  const pts: Record<StatId, number> = { body: 0, mind: 0, wealth: 0, discipline: 0, social: 0 };
  const byId = new Map(state.quests.map((q) => [q.id, q]));
  const add = (ids: StatId[], p: number) => {
    ids.forEach((id, i) => (pts[id] += i === 0 ? p : p / 2));
  };
  const counted = (ids: string[], skipped: string[] = []) => {
    const skip = new Set(skipped);
    for (const id of ids) {
      if (skip.has(id)) continue;
      const q = byId.get(id);
      // A quest you've since deleted still counts a little, for Discipline.
      if (q) add(questStats(q), questPoints(q));
      else pts.discipline += 10;
    }
  };
  for (const log of Object.values(state.dayLogs ?? {})) {
    if (!log || (since && log.date < since)) continue;
    counted(log.completedQuestIds ?? [], log.skipped);
    if (log.perfectDay) pts.discipline += 15;
  }
  for (const log of Object.values(state.weekLogs ?? {})) {
    if (!log || since) continue; // weekly quests only count in the all-time total
    counted(log.completedQuestIds ?? []);
    if (log.perfectWeek) pts.discipline += 40;
  }
  // Challenge quests count by their title (Run → Body, Read → Mind…).
  for (const ch of state.challenges ?? []) {
    for (const [d, ids] of Object.entries(ch.done ?? {})) {
      if (since && d < since) continue;
      for (const i of new Set(ids)) if (ch.quests[i]) add(questStats({ title: ch.quests[i].title, category: '' }), 10);
    }
  }
  for (const r of state.runs ?? []) if (!since || r.date >= since) pts.body += Math.min(200, (r.km || 0) * 20);
  for (const [d, m] of Object.entries(state.focusMinutes ?? {})) if (!since || d >= since) pts.discipline += Math.min(240, m || 0) / 2;
  for (const n of state.sleep?.log ?? []) if ((!since || n.date >= since) && n.hours >= 7) pts.body += 10;
  for (const d of Object.keys(state.moods ?? {})) if (!since || d >= since) pts.mind += 3;
  // Money habits: every day you tracked spending, and every savings goal you reached.
  const trackedDays = new Set((state.money?.expenses ?? []).filter((e) => !since || e.date >= since).map((e) => e.date));
  pts.wealth += trackedDays.size * 5;
  if (!since) {
    const accounts = new Map((state.money?.accounts ?? []).map((a) => [a.id, a.amount]));
    for (const g of state.money?.goals ?? []) if (g.target > 0 && (accounts.get(g.accountId) ?? 0) >= g.target) pts.wealth += 200;
    pts.discipline += Math.min(3650, extras.longestStreak ?? 0) * 8;
    pts.social += Math.min(50, extras.friends ?? 0) * 40;
  }
  return pts;
}

/** All five stats with level, progress and rank. */
export function irlStats(state: AppState, extras: StatExtras = {}): IrlStats {
  const p = statPoints(state, extras);
  return Object.fromEntries(STAT_IDS.map((id) => [id, value(id, p[id])])) as IrlStats;
}

/** One number for the whole character: the average stat level. */
export function overallStatLevel(s: IrlStats): number {
  return Math.round(STAT_IDS.reduce((sum, id) => sum + s[id].level, 0) / STAT_IDS.length);
}
