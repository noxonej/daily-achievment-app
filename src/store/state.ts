/**
 * Shared state helpers for the reducer slices (src/store/slices) and the rest of the app:
 * initial state, content migrations, and small helpers several slices need.
 */
import { safeLink } from '../lib/url';
import type { AppState, DayLog, Difficulty, Frequency, GoalTimeframe, LongTermGoal, PlanItem, Quest, WeekLog, WeekPlan, WeekdayId, MoneyAccount, QuestMeasure, MoneyState, SavingsGoal } from '../lib/types';
import {  todayKey, weekKey } from '../lib/date';
import { buildDefaultQuests } from '../data/defaultQuests';
import { buildDefaultGoals } from '../data/defaultGoals';
import { questReward } from '../lib/rewards';
import {  DEFAULT_LOOK, type OwnershipContext } from '../data/avatar';
import { DEFAULT_PREFS, guessLanguage } from '../lib/i18n';
import { createEmptyMoney } from '../lib/money';

export function createInitialState(): AppState {
  return {
    quests: buildDefaultQuests(),
    goals: buildDefaultGoals(),
    dayLogs: {},
    weekLogs: {},
    unlockedAchievements: [],
    lastOpenedDate: todayKey(),
    wildcardEnabled: true,
    character: { ...DEFAULT_LOOK },
    unlockedCosmeticIds: [],
    wonCosmeticIds: [],
    chestsOpened: 0,
    bonusShards: 0,
    weekPlan: createEmptyWeekPlan(),
    money: createEmptyMoney(),
    onboarded: false,
    profile: { name: '', focusAreas: [], wakeTime: '07:00', bedTime: '22:30' },
    moods: {},
    focusMinutes: {},
    runs: [],
    contentVersion: CONTENT_VERSION,
    appearance: { accent: 'squzo', background: 'obsidian' },
    dailyBox: { lastOpened: null, lastReward: null },
    prefs: { ...DEFAULT_PREFS, language: guessLanguage() },
    notes: [],
    questSwaps: 0,
    skipPasses: 0,
    streakShields: 0,
    shieldedDates: [],
    bonusChests: 0,
    createdAt: new Date().toISOString(),
  };
}

export function ownership(state: AppState, stats: { level: number; longestStreak: number }): OwnershipContext {
  return {
    bought: state.unlockedCosmeticIds ?? [],
    won: state.wonCosmeticIds ?? [],
    level: stats.level,
    longestStreak: stats.longestStreak,
  };
}

export function createEmptyWeekPlan(): WeekPlan {
  return {
    days: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
    checkedWeekKey: weekKey(),
    checkedIds: [],
  };
}

export function planId(): string {
  return `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Older saves (or partial imports) may be missing the plan or some days; fill the gaps. */
export function normalizePlan(plan: WeekPlan | undefined): WeekPlan {
  const empty = createEmptyWeekPlan();
  if (!plan || typeof plan !== 'object') return empty;
  return {
    days: { ...empty.days, ...(plan.days ?? {}) },
    checkedWeekKey: plan.checkedWeekKey ?? empty.checkedWeekKey,
    checkedIds: Array.isArray(plan.checkedIds) ? plan.checkedIds : [],
    events: Array.isArray(plan.events) ? plan.events : [],
  };
}

export function withPlanDay(state: AppState, day: WeekdayId, items: PlanItem[]): AppState {
  const plan = normalizePlan(state.weekPlan);
  return { ...state, weekPlan: { ...plan, days: { ...plan.days, [day]: items } } };
}

export function normalizeMoney(money: MoneyState | undefined): MoneyState {
  const empty = createEmptyMoney();
  if (!money || typeof money !== 'object') return empty;
  return {
    currency: money.currency || empty.currency,
    setupDone: !!money.setupDone,
    accounts: Array.isArray(money.accounts) ? money.accounts : [],
    categories: Array.isArray(money.categories) ? money.categories : empty.categories,
    expenses: Array.isArray(money.expenses) ? money.expenses : [],
    goals: Array.isArray(money.goals) ? money.goals : [],
    crypto: Array.isArray(money.crypto) ? money.crypto : [],
    cryptoPrices: money.cryptoPrices,
    bills: Array.isArray(money.bills) ? money.bills : [],
    // Links come from typing or a backup file: only http(s) survives (A5).
    wishlist: Array.isArray(money.wishlist) ? money.wishlist.map((w) => (w && w.link !== undefined ? { ...w, link: safeLink(w.link) } : w)) : [],
    income: money.income,
    saveRate: money.saveRate,
    mode: money.mode,
  };
}

export function withMoney(state: AppState, update: (m: MoneyState) => MoneyState): AppState {
  return { ...state, money: update(normalizeMoney(state.money)) };
}

export function adjustAccount(accounts: MoneyAccount[], id: string | undefined, delta: number): MoneyAccount[] {
  return accounts.map((a) => (a.id === id ? { ...a, amount: a.amount + delta } : a));
}

export function cleanTime(time: string | undefined): string | undefined {
  const t = time?.trim();
  return t && /^\d{2}:\d{2}$/.test(t) ? t : undefined;
}

export interface NewQuestInput {
  title: string;
  description?: string;
  frequency: Frequency;
  difficulty: Difficulty;
  icon: string;
  category: string;
  promptForNote?: boolean;
  details?: string;
  noteList?: number;
  noteMinWords?: number;
  measure?: QuestMeasure;
}

/** True when this goal's account holds only this goal's money (no other goal shares it). */
export function isOwnFund(m: MoneyState, goal: SavingsGoal): boolean {
  const acct = m.accounts.find((a) => a.id === goal.accountId);
  if (!acct || acct.kind !== 'savings') return false;
  if (m.goals.some((g) => g.id !== goal.id && g.accountId === goal.accountId)) return false;
  const n = acct.name.trim().toLowerCase();
  const gn = goal.name.trim().toLowerCase();
  return n === gn || n === `${gn} fund` || n.endsWith(' fund') || n === '52-week challenge' || n === 'emergency fund';
}

export interface NewGoalInput {
  title: string;
  description?: string;
  timeframe: GoalTimeframe;
  target: number;
  unit: string;
  icon: string;
  kind?: LongTermGoal['kind'];
  /** Only used when editing: how much is done so far. */
  progress?: number;
}

// Both recompute functions spread over `existing` first so fields they don't
// touch (notes, freeNote, quickTasks, ...) survive every recompute untouched.
/**
 * Legendary collection XP bonus (percent) for the action being reduced. Set at the top of every
 * reduce call so today's XP always uses the bonus you have right now; past days are never touched.
 */
export let currentBonusPct = 0;
/** Set at the top of every reduce call (see reducer.ts). */
export function setBonusPct(pct: number) {
  currentBonusPct = pct;
}

export function recomputeDailyLog(quests: Quest[], completedIds: string[], existing?: Partial<DayLog>): DayLog {
  // The wildcard quest is a bonus and doesn't count toward the "perfect day" requirement.
  const activeDaily = quests.filter((q) => q.frequency === 'daily' && !q.archived && !q.wildcardDate);
  const dateKey = todayKey();
  // Skipped quests (Skip Pass) always stay done for today, but earn nothing.
  const skipped = existing?.skipped ?? [];
  const completedQuestIds = skipped.length ? [...new Set([...completedIds, ...skipped])] : completedIds;
  const xpEarned = completedQuestIds.reduce((sum, id) => {
    if (skipped.includes(id)) return sum;
    const q = quests.find((x) => x.id === id);
    return sum + (q ? questReward(dateKey, id, q.xp).xp : 0);
  }, 0);
  const perfectDay = activeDaily.length > 0 && activeDaily.every((q) => completedQuestIds.includes(q.id));
  return {
    ...existing,
    date: dateKey,
    completedQuestIds,
    xpEarned: Math.round(xpEarned * (existing?.xpBoost ?? 1) * (1 + currentBonusPct / 100)),
    ...(currentBonusPct > 0 ? { bonusPct: currentBonusPct } : {}),
    perfectDay,
    dailyQuestCount: activeDaily.length,
  };
}

export function recomputeWeeklyLog(quests: Quest[], completedQuestIds: string[], existing?: Partial<WeekLog>): WeekLog {
  // The weekly wildcard quest is a bonus and doesn't count toward "perfect week".
  const activeWeekly = quests.filter((q) => q.frequency === 'weekly' && !q.archived && !q.wildcardWeekKey);
  const wKey = weekKey();
  const xpEarned = completedQuestIds.reduce((sum, id) => {
    const q = quests.find((x) => x.id === id);
    return sum + (q ? questReward(wKey, id, q.xp).xp : 0);
  }, 0);
  const perfectWeek = activeWeekly.length > 0 && activeWeekly.every((q) => completedQuestIds.includes(q.id));
  return {
    ...existing,
    weekKey: wKey,
    completedQuestIds,
    xpEarned,
    perfectWeek,
    weeklyQuestCount: activeWeekly.length,
  };
}

export const STARTER_BY_AREA: Record<string, string[]> = {
  health: ['Move your body', 'Drink 2L of water', 'Walk 8,000 steps', 'No junk food'],
  mind: ['Meditate 10 minutes', 'Gratitude x3', 'Journal'],
  study: ['Read 15 pages', 'Journal'],
  money: ['Read 15 pages', 'Tidy your space'],
  work: ['Tidy your space', 'Read 15 pages'],
  sleep: ['Meditate 10 minutes', 'Tidy your space'],
};

/** Four starter daily quests, taking turns between the chosen focus areas. */
export function starterQuestTitles(areas: string[]): string[] {
  const lists = areas.map((a) => STARTER_BY_AREA[a] ?? []).filter((l) => l.length);
  const picked: string[] = [];
  for (let i = 0; picked.length < 4 && i < 4; i++) {
    for (const l of lists) if (l[i] && !picked.includes(l[i]) && picked.length < 4) picked.push(l[i]);
  }
  for (const t of ['Move your body', 'Read 15 pages', 'Drink 2L of water', 'Tidy your space']) if (picked.length < 4 && !picked.includes(t)) picked.push(t);
  return picked;
}

/** Quests finished for real today (Skip Pass skips don't count, e.g. for unlocking the daily box). */
export function doneByHand(log: DayLog | undefined): number {
  if (!log) return 0;
  const skipped = new Set(log.skipped ?? []);
  return log.completedQuestIds.filter((id) => !skipped.has(id)).length;
}

export const CONTENT_VERSION = 7;

export function mondayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return todayKey(d);
}

export function currentProgress(state: AppState, quest: Quest): number {
  const log = quest.frequency === 'daily' ? state.dayLogs[todayKey()] : state.weekLogs[weekKey()];
  return log?.progress?.[quest.id] ?? 0;
}

/** Stores a number-quest total for the current day/week and completes (or un-completes) it against its target. */
export function withProgress(state: AppState, quest: Quest, total: number): AppState {
  const target = quest.measure?.target ?? Infinity;
  if (quest.frequency === 'daily') {
    const key = todayKey();
    const existing = state.dayLogs[key];
    const completed = (existing?.completedQuestIds ?? []).filter((id) => id !== quest.id);
    if (total >= target) completed.push(quest.id);
    const progress = { ...(existing?.progress ?? {}), [quest.id]: total };
    return { ...state, dayLogs: { ...state.dayLogs, [key]: recomputeDailyLog(state.quests, completed, { ...existing, progress }) } };
  }
  const key = weekKey();
  const existing = state.weekLogs[key];
  const completed = (existing?.completedQuestIds ?? []).filter((id) => id !== quest.id);
  if (total >= target) completed.push(quest.id);
  const progress = { ...(existing?.progress ?? {}), [quest.id]: total };
  return { ...state, weekLogs: { ...state.weekLogs, [key]: recomputeWeeklyLog(state.quests, completed, { ...existing, progress }) } };
}

/**
 * One-time upgrades for saves made before newer built-in content existed:
 * v2 adds a daily steps quest and a weekly running quest, and turns the water quest into a glass counter.
 */
/** The accent + background pairs first-run setup used to choose automatically (before v4). */
export const ONBOARDING_LOOKS: Array<[string, string]> = [
  ['emerald', 'aurora'], ['violet', 'candy'], ['ocean', 'deepsea'], ['amber', 'graphite'], ['sunset', 'ember'], ['indigo', 'midnight'], ['cyber', 'nebula'],
];

export function migrateContent(state: AppState): AppState {
  const version = state.contentVersion ?? 1;
  if (version >= CONTENT_VERSION) return state;
  let quests = version >= 2 ? state.quests : state.quests.map((q) =>
    !q.custom && q.title === 'Drink 2L of water' && !q.measure ? { ...q, measure: { unit: 'glasses' as const, target: 8 } } : q,
  );
  for (const extra of version >= 2 ? [] : buildDefaultQuests().filter((q) => q.id === 'default-steps' || q.id === 'default-run')) {
    if (!quests.some((q) => q.id === extra.id)) quests = [...quests, extra];
  }
  // v3 made Nebula the default; v4 (the 2026 redesign) makes Obsidian the default. A theme picked by hand is kept.
  let appearance = state.appearance?.chosen ? state.appearance : { accent: 'squzo' as const, background: 'obsidian' as const };
  // Setup used to pick colours to match your goals (accent + background in pairs). Those weren't picked
  // by hand, so they move to the new Squzo look too. Colours picked in Settings are kept.
  if (version < 4 && appearance.chosen && ONBOARDING_LOOKS.some(([a, b]) => a === appearance.accent && b === appearance.background)) {
    appearance = { ...appearance, accent: 'squzo', background: 'obsidian' };
  }
  // v5: reminders and the daily quote are on for everyone (you can still switch them off in Settings).
  const prefs = version < 5 && state.prefs ? { ...state.prefs, nudges: true, daily: state.prefs.daily === 'off' ? ('quotes' as const) : state.prefs.daily } : state.prefs;
  // v6: the default colour became Squzo blue (the app icon's colour). Flame was the old default, so it moves too.
  if (version < 6 && appearance.accent === 'flame') appearance = { ...appearance, accent: 'squzo' };
  // v7: every quest gives 50% more XP (past days keep what they earned).
  if (version < 7) quests = quests.map((q) => ({ ...q, xp: Math.round((q.xp * 1.5) / 5) * 5 || q.xp }));
  return { ...state, quests, runs: state.runs ?? [], appearance, prefs, contentVersion: CONTENT_VERSION };
}
