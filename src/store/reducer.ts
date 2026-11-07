import type { AppState, CosmeticSlot, DayLog, Difficulty, Frequency, GoalTimeframe, LongTermGoal, PlanCategory, PlanItem, Quest, WeekLog, WeekPlan, WeekdayId, MoneyAccount, Mood, Profile, Appearance, Prefs, NoteEntry, QuestMeasure, RunRecord, MoneyKind, MoneyState, SavingsGoal, SpendCategory, CryptoHolding, Bill, Sharing, WishItem } from '../lib/types';
import { addDaysToKey, todayKey, weekKey } from '../lib/date';
import { buildDefaultQuests } from '../data/defaultQuests';
import { buildDefaultGoals } from '../data/defaultGoals';
import { buildWildcardQuestForDate, buildWeeklyWildcardQuestForWeek } from '../lib/wildcard';
import { DIFFICULTY_XP } from '../lib/xp';
import { questReward } from '../lib/rewards';
import { CHEST_DUPLICATE_SHARDS, DEFAULT_LOOK, boxPool, chestPool, findItem, isOwned, normalizeLook, type OwnershipContext } from '../data/avatar';
import { computeDerivedStats, dayCountsForStreak, graceDays } from '../lib/stats';
import { checkNote } from '../lib/questRules';
import type { BoxReward } from '../lib/dailyBox';
import { DEFAULT_PREFS, guessLanguage } from '../lib/i18n';
import { createEmptyMoney, moneyId } from '../lib/money';

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
    appearance: { accent: 'cyber', background: 'nebula' },
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

function planId(): string {
  return `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Older saves (or partial imports) may be missing the plan or some days; fill the gaps. */
function normalizePlan(plan: WeekPlan | undefined): WeekPlan {
  const empty = createEmptyWeekPlan();
  if (!plan || typeof plan !== 'object') return empty;
  return {
    days: { ...empty.days, ...(plan.days ?? {}) },
    checkedWeekKey: plan.checkedWeekKey ?? empty.checkedWeekKey,
    checkedIds: Array.isArray(plan.checkedIds) ? plan.checkedIds : [],
    events: Array.isArray(plan.events) ? plan.events : [],
  };
}

function withPlanDay(state: AppState, day: WeekdayId, items: PlanItem[]): AppState {
  const plan = normalizePlan(state.weekPlan);
  return { ...state, weekPlan: { ...plan, days: { ...plan.days, [day]: items } } };
}

function normalizeMoney(money: MoneyState | undefined): MoneyState {
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
    wishlist: Array.isArray(money.wishlist) ? money.wishlist : [],
    income: money.income,
    saveRate: money.saveRate,
  };
}

function withMoney(state: AppState, update: (m: MoneyState) => MoneyState): AppState {
  return { ...state, money: update(normalizeMoney(state.money)) };
}

function adjustAccount(accounts: MoneyAccount[], id: string | undefined, delta: number): MoneyAccount[] {
  return accounts.map((a) => (a.id === id ? { ...a, amount: a.amount + delta } : a));
}

function cleanTime(time: string | undefined): string | undefined {
  const t = time?.trim();
  return t && /^\d{2}:\d{2}$/.test(t) ? t : undefined;
}

export type Action =
  | { type: 'TOGGLE_QUEST'; questId: string }
  | { type: 'ADD_QUEST'; quest: NewQuestInput }
  | { type: 'UPDATE_QUEST'; questId: string; updates: Partial<NewQuestInput> }
  | { type: 'DELETE_QUEST'; questId: string }
  | { type: 'TOGGLE_ARCHIVE_QUEST'; questId: string }
  | { type: 'ADD_GOAL'; goal: NewGoalInput }
  | { type: 'UPDATE_GOAL'; goalId: string; updates: Partial<NewGoalInput> }
  | { type: 'ADJUST_GOAL_PROGRESS'; goalId: string; delta: number }
  | { type: 'DELETE_GOAL'; goalId: string }
  | { type: 'UNLOCK_ACHIEVEMENTS'; ids: string[] }
  | { type: 'MARK_DAY_OPENED'; date: string }
  | { type: 'SYNC_WILDCARD' }
  | { type: 'SET_WILDCARD_ENABLED'; enabled: boolean }
  | { type: 'UNLOCK_COSMETIC'; itemId: string }
  | { type: 'EQUIP_COSMETIC'; slot: CosmeticSlot; itemId: string }
  /** itemId is the rolled prize, or null when everything is owned (gives bonus shards instead). */
  | { type: 'OPEN_CHEST'; itemId: string | null; skip?: boolean }
  | { type: 'SET_QUEST_NOTE'; questId: string; note: string }
  | { type: 'SET_FREE_NOTE'; note: string }
  | { type: 'ADD_QUICK_TASK'; text: string }
  | { type: 'TOGGLE_QUICK_TASK'; taskId: string }
  | { type: 'DELETE_QUICK_TASK'; taskId: string }
  | { type: 'PLAN_ADD'; day: WeekdayId; text: string; time?: string; category?: PlanCategory; date?: string; note?: string }
  | { type: 'PLAN_UPDATE'; day: WeekdayId; itemId: string; text: string; time?: string; category?: PlanCategory; date?: string; note?: string }
  | { type: 'PLAN_LOAD_STARTER'; days: Record<WeekdayId, Array<Omit<PlanItem, 'id'>>> }
  | { type: 'PLAN_DELETE'; day: WeekdayId; itemId: string }
  | { type: 'PLAN_TOGGLE'; itemId: string }
  | { type: 'PLAN_COPY_DAY'; from: WeekdayId; to: WeekdayId[] }
  | { type: 'PLAN_CLEAR_DAY'; day: WeekdayId }
  | { type: 'MONEY_SETUP'; currency: string; amounts: Record<MoneyKind, number> }
  | { type: 'MONEY_SET_CURRENCY'; currency: string }
  | { type: 'MONEY_UPSERT_ACCOUNT'; account: Omit<MoneyAccount, 'id'> & { id?: string } }
  | { type: 'MONEY_DELETE_ACCOUNT'; accountId: string }
  | { type: 'MONEY_TRANSFER'; fromId: string; toId: string; amount: number }
  | { type: 'MONEY_ADD_EXPENSE'; amount: number; categoryId: string; accountId?: string; note?: string }
  | { type: 'MONEY_DELETE_EXPENSE'; expenseId: string }
  | { type: 'MONEY_SET_CATEGORIES'; categories: SpendCategory[] }
  | {
      type: 'MONEY_UPSERT_GOAL';
      goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'accountId'> & { id?: string; accountId?: string };
      /** When set, a new savings account is created to hold the goal's money, starting at this many cents. */
      newAccount?: { name: string; amount: number; fromAccountId?: string };
    }
  | { type: 'MONEY_DELETE_GOAL'; goalId: string }
  | {
      type: 'COMPLETE_ONBOARDING';
      profile: Profile;
      plan: Record<WeekdayId, Array<Omit<PlanItem, 'id'>>>;
    }
  | { type: 'SET_PROFILE'; profile: Partial<Profile> }
  | { type: 'SET_MOOD'; date: string; mood: Mood | null }
  | { type: 'SET_APPEARANCE'; appearance: Partial<Appearance> }
  | { type: 'SET_PREFS'; prefs: Partial<Prefs> }
  | { type: 'SET_DIARY'; date: string; text: string }
  | { type: 'UPSERT_NOTE'; note: Partial<NoteEntry> & { id?: string } }
  | { type: 'DELETE_NOTE'; noteId: string }
  | { type: 'ADD_FOCUS_MINUTES'; date: string; minutes: number }
  /** Sets today's (or this week's) total on a number-based quest; completes it at the target. */
  | { type: 'SET_PROGRESS'; questId: string; value: number }
  /** Change a number quest's goal, glass size or quick buttons; today's progress is kept (rescaled for a new glass size). */
  | { type: 'SET_MEASURE'; questId: string; measure: QuestMeasure }
  | { type: 'ADD_RUN'; km: number; seconds: number; source: 'gps' | 'manual' }
  | { type: 'OPEN_DAILY_BOX'; reward: BoxReward }
  | { type: 'USE_SKIP_PASS'; questId: string }
  | { type: 'PRUNE_PLAN_EVENTS'; today: string }
  | { type: 'GUIDE_MARK'; key: string }
  | { type: 'SET_STREAK_POP'; date: string }
  | { type: 'SET_SHARING'; sharing: Partial<Sharing> }
  | { type: 'MONEY_UPSERT_CRYPTO'; holding: Omit<CryptoHolding, 'id'> & { id?: string } }
  | { type: 'MONEY_DELETE_CRYPTO'; holdingId: string }
  | { type: 'MONEY_SET_CRYPTO_PRICES'; prices: NonNullable<MoneyState['cryptoPrices']> }
  | { type: 'MONEY_UPSERT_BILL'; bill: Omit<Bill, 'id'> & { id?: string } }
  | { type: 'MONEY_DELETE_BILL'; billId: string }
  | { type: 'MONEY_UPSERT_WISH'; wish: Omit<WishItem, 'id' | 'addedAt'> & { id?: string } }
  | { type: 'MONEY_DELETE_WISH'; wishId: string }
  | { type: 'MONEY_SET_INCOME'; income: MoneyState['income']; saveRate?: number }
  | { type: 'USE_QUEST_SWAP'; questId: string; replacement: { title: string; description?: string; icon: string } }
  /** Spends Streak Shields on missed days right before today, if that keeps an existing streak alive. */
  | { type: 'CHECK_STREAK_SHIELDS' }
  | { type: 'DELETE_RUN'; runId: string }
  | { type: 'IMPORT_STATE'; state: AppState }
  | { type: 'RESET_ALL' };

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

export interface NewGoalInput {
  title: string;
  description?: string;
  timeframe: GoalTimeframe;
  target: number;
  unit: string;
  icon: string;
}

// Both recompute functions spread over `existing` first so fields they don't
// touch (notes, freeNote, quickTasks, ...) survive every recompute untouched.
function recomputeDailyLog(quests: Quest[], completedIds: string[], existing?: Partial<DayLog>): DayLog {
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
    xpEarned: Math.round(xpEarned * (existing?.xpBoost ?? 1)),
    perfectDay,
    dailyQuestCount: activeDaily.length,
  };
}

function recomputeWeeklyLog(quests: Quest[], completedQuestIds: string[], existing?: Partial<WeekLog>): WeekLog {
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

const STARTER_BY_AREA: Record<string, string[]> = {
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

export const CONTENT_VERSION = 3;

function mondayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return todayKey(d);
}

export function currentProgress(state: AppState, quest: Quest): number {
  const log = quest.frequency === 'daily' ? state.dayLogs[todayKey()] : state.weekLogs[weekKey()];
  return log?.progress?.[quest.id] ?? 0;
}

/** Stores a number-quest total for the current day/week and completes (or un-completes) it against its target. */
function withProgress(state: AppState, quest: Quest, total: number): AppState {
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
export function migrateContent(state: AppState): AppState {
  const version = state.contentVersion ?? 1;
  if (version >= CONTENT_VERSION) return state;
  let quests = version >= 2 ? state.quests : state.quests.map((q) =>
    !q.custom && q.title === 'Drink 2L of water' && !q.measure ? { ...q, measure: { unit: 'glasses' as const, target: 8 } } : q,
  );
  for (const extra of version >= 2 ? [] : buildDefaultQuests().filter((q) => q.id === 'default-steps' || q.id === 'default-run')) {
    if (!quests.some((q) => q.id === extra.id)) quests = [...quests, extra];
  }
  // v3: the futuristic Nebula look becomes the default, unless a theme was picked by hand.
  const appearance = state.appearance?.chosen ? state.appearance : { accent: 'cyber' as const, background: 'nebula' as const };
  return { ...state, quests, runs: state.runs ?? [], appearance, contentVersion: CONTENT_VERSION };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'TOGGLE_QUEST': {
      const quest = state.quests.find((q) => q.id === action.questId);
      if (!quest) return state;

      if (quest.frequency === 'daily') {
        const key = todayKey();
        const existing = state.dayLogs[key];
        const completed = existing ? [...existing.completedQuestIds] : [];
        const idx = completed.indexOf(quest.id);
        if (idx >= 0) completed.splice(idx, 1);
        else completed.push(quest.id);
        const newLog = recomputeDailyLog(state.quests, completed, existing);
        return { ...state, dayLogs: { ...state.dayLogs, [key]: newLog } };
      } else {
        const key = weekKey();
        const existing = state.weekLogs[key];
        const completed = existing ? [...existing.completedQuestIds] : [];
        const idx = completed.indexOf(quest.id);
        if (idx >= 0) completed.splice(idx, 1);
        else completed.push(quest.id);
        const newLog = recomputeWeeklyLog(state.quests, completed, existing);
        return { ...state, weekLogs: { ...state.weekLogs, [key]: newLog } };
      }
    }

    case 'SET_QUEST_NOTE': {
      const quest = state.quests.find((q) => q.id === action.questId);
      if (!quest) return state;
      // Only a real answer completes it (e.g. three different things for "Gratitude x3"), but whatever was typed is kept.
      const hasText = action.note.trim().length > 0;
      const hasContent = checkNote(quest, action.note).done;

      if (quest.frequency === 'daily') {
        const key = todayKey();
        const existing = state.dayLogs[key];
        const completed = existing ? [...existing.completedQuestIds] : [];
        const idx = completed.indexOf(quest.id);
        if (hasContent && idx < 0) completed.push(quest.id);
        if (!hasContent && idx >= 0) completed.splice(idx, 1);
        const notes = { ...(existing?.notes ?? {}) };
        if (hasText) notes[quest.id] = action.note;
        else delete notes[quest.id];
        const newLog = recomputeDailyLog(state.quests, completed, { ...existing, notes });
        return { ...state, dayLogs: { ...state.dayLogs, [key]: newLog } };
      } else {
        const key = weekKey();
        const existing = state.weekLogs[key];
        const completed = existing ? [...existing.completedQuestIds] : [];
        const idx = completed.indexOf(quest.id);
        if (hasContent && idx < 0) completed.push(quest.id);
        if (!hasContent && idx >= 0) completed.splice(idx, 1);
        const notes = { ...(existing?.notes ?? {}) };
        if (hasText) notes[quest.id] = action.note;
        else delete notes[quest.id];
        const newLog = recomputeWeeklyLog(state.quests, completed, { ...existing, notes });
        return { ...state, weekLogs: { ...state.weekLogs, [key]: newLog } };
      }
    }

    case 'SET_FREE_NOTE': {
      const key = todayKey();
      const existing = state.dayLogs[key];
      const completed = existing?.completedQuestIds ?? [];
      const newLog = recomputeDailyLog(state.quests, completed, { ...existing, freeNote: action.note });
      return { ...state, dayLogs: { ...state.dayLogs, [key]: newLog } };
    }

    case 'ADD_QUICK_TASK': {
      const key = todayKey();
      const existing = state.dayLogs[key];
      const completed = existing?.completedQuestIds ?? [];
      const quickTasks = [
        ...(existing?.quickTasks ?? []),
        { id: `qt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text: action.text, done: false },
      ];
      const newLog = recomputeDailyLog(state.quests, completed, { ...existing, quickTasks });
      return { ...state, dayLogs: { ...state.dayLogs, [key]: newLog } };
    }

    case 'TOGGLE_QUICK_TASK': {
      const key = todayKey();
      const existing = state.dayLogs[key];
      if (!existing?.quickTasks) return state;
      const quickTasks = existing.quickTasks.map((t) => (t.id === action.taskId ? { ...t, done: !t.done } : t));
      const newLog = recomputeDailyLog(state.quests, existing.completedQuestIds, { ...existing, quickTasks });
      return { ...state, dayLogs: { ...state.dayLogs, [key]: newLog } };
    }

    case 'DELETE_QUICK_TASK': {
      const key = todayKey();
      const existing = state.dayLogs[key];
      if (!existing?.quickTasks) return state;
      const quickTasks = existing.quickTasks.filter((t) => t.id !== action.taskId);
      const newLog = recomputeDailyLog(state.quests, existing.completedQuestIds, { ...existing, quickTasks });
      return { ...state, dayLogs: { ...state.dayLogs, [key]: newLog } };
    }

    case 'ADD_QUEST': {
      const q: Quest = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: action.quest.title,
        description: action.quest.description,
        frequency: action.quest.frequency,
        difficulty: action.quest.difficulty,
        xp: DIFFICULTY_XP[action.quest.difficulty],
        icon: action.quest.icon || (action.quest.frequency === 'daily' ? '🎯' : '🏔️'),
        category: action.quest.category || 'Custom',
        custom: true,
        archived: false,
        createdAt: new Date().toISOString(),
        promptForNote: action.quest.promptForNote,
        details: action.quest.details,
        noteList: action.quest.noteList,
        noteMinWords: action.quest.noteMinWords,
        measure: action.quest.measure,
      };
      return { ...state, quests: [...state.quests, q] };
    }

    case 'UPDATE_QUEST': {
      return {
        ...state,
        quests: state.quests.map((q) => {
          if (q.id !== action.questId) return q;
          const updated = { ...q, ...action.updates };
          if (action.updates.difficulty) updated.xp = DIFFICULTY_XP[action.updates.difficulty];
          return updated;
        }),
      };
    }

    case 'DELETE_QUEST': {
      return { ...state, quests: state.quests.filter((q) => q.id !== action.questId) };
    }

    case 'TOGGLE_ARCHIVE_QUEST': {
      return {
        ...state,
        quests: state.quests.map((q) => (q.id === action.questId ? { ...q, archived: !q.archived } : q)),
      };
    }

    case 'ADD_GOAL': {
      const g: LongTermGoal = {
        id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: action.goal.title,
        description: action.goal.description,
        timeframe: action.goal.timeframe,
        target: action.goal.target,
        unit: action.goal.unit,
        progress: 0,
        icon: action.goal.icon || '🎯',
        createdAt: new Date().toISOString(),
      };
      return { ...state, goals: [...state.goals, g] };
    }

    case 'UPDATE_GOAL': {
      return {
        ...state,
        goals: state.goals.map((g) => (g.id === action.goalId ? { ...g, ...action.updates } : g)),
      };
    }

    case 'ADJUST_GOAL_PROGRESS': {
      return {
        ...state,
        goals: state.goals.map((g) => {
          if (g.id !== action.goalId) return g;
          const nextProgress = Math.max(0, Math.min(g.target, g.progress + action.delta));
          const wasComplete = !!g.completedAt;
          const isComplete = nextProgress >= g.target;
          return {
            ...g,
            progress: nextProgress,
            completedAt: isComplete ? g.completedAt ?? new Date().toISOString() : wasComplete ? g.completedAt : undefined,
          };
        }),
      };
    }

    case 'DELETE_GOAL': {
      return { ...state, goals: state.goals.filter((g) => g.id !== action.goalId) };
    }

    case 'UNLOCK_ACHIEVEMENTS': {
      const now = new Date().toISOString();
      const existingIds = new Set(state.unlockedAchievements.map((a) => a.id));
      const newOnes = action.ids.filter((id) => !existingIds.has(id)).map((id) => ({ id, unlockedAt: now }));
      if (newOnes.length === 0) return state;
      return { ...state, unlockedAchievements: [...state.unlockedAchievements, ...newOnes] };
    }

    case 'MARK_DAY_OPENED':
      return { ...state, lastOpenedDate: action.date };

    case 'SET_SHARING':
      return { ...state, sharing: { ...{ quests: true, runs: true, streak: true, level: true, badges: true }, ...(state.sharing ?? {}), ...action.sharing } };

    case 'SET_STREAK_POP':
      return { ...state, streakPopDate: action.date };

    case 'GUIDE_MARK':
      return (state.guide ?? []).includes(action.key) ? state : { ...state, guide: [...(state.guide ?? []), action.key] };

    case 'PRUNE_PLAN_EVENTS': {
      // One-time plan items vanish once their day is over.
      const plan = normalizePlan(state.weekPlan);
      const all = plan.events ?? [];
      const events = all.filter((e) => (e.date ?? '') >= action.today);
      if (events.length === all.length) return state;
      const gone = new Set(all.filter((e) => !events.includes(e)).map((e) => e.id));
      return { ...state, weekPlan: { ...plan, events, checkedIds: plan.checkedIds.filter((id) => !gone.has(id)) } };
    }

    case 'SYNC_WILDCARD': {
      const today = todayKey();
      const thisWeek = weekKey();
      const withoutStale = state.quests.filter(
        (q) => (!q.wildcardDate || q.wildcardDate === today) && (!q.wildcardWeekKey || q.wildcardWeekKey === thisWeek),
      );
      const removedStale = withoutStale.length !== state.quests.length;

      if (!state.wildcardEnabled) {
        const withoutAnyWildcard = withoutStale.filter((q) => !q.wildcardDate && !q.wildcardWeekKey);
        return withoutAnyWildcard.length !== state.quests.length ? { ...state, quests: withoutAnyWildcard } : state;
      }

      let quests = withoutStale;
      let changed = removedStale;
      if (!quests.some((q) => q.wildcardDate === today)) {
        quests = [...quests, buildWildcardQuestForDate(today)];
        changed = true;
      }
      if (!quests.some((q) => q.wildcardWeekKey === thisWeek)) {
        quests = [...quests, buildWeeklyWildcardQuestForWeek(thisWeek)];
        changed = true;
      }
      return changed ? { ...state, quests } : state;
    }

    case 'SET_WILDCARD_ENABLED': {
      return { ...state, wildcardEnabled: action.enabled };
    }

    case 'UNLOCK_COSMETIC': {
      const item = findItem(action.itemId);
      if (!item || item.unlock.kind !== 'shop') return state;
      const stats = computeDerivedStats(state);
      if (isOwned(item, ownership(state, stats)) || stats.availableShards < item.unlock.cost) return state;
      return {
        ...state,
        unlockedCosmeticIds: [...state.unlockedCosmeticIds, action.itemId],
        purchases: { ...(state.purchases ?? {}), [action.itemId]: item.unlock.cost },
      };
    }

    case 'EQUIP_COSMETIC': {
      const item = findItem(action.itemId);
      if (!item || item.slot !== action.slot) return state;
      if (!isOwned(item, ownership(state, computeDerivedStats(state)))) return state;
      return { ...state, character: { ...normalizeLook(state.character), [action.slot]: action.itemId } };
    }

    case 'OPEN_CHEST': {
      const stats = computeDerivedStats(state);
      if (stats.chestsAvailable <= 0) return state;
      const chestsOpened = (state.chestsOpened ?? 0) + 1;
      if (action.skip) return { ...state, chestsOpened, skipPasses: (state.skipPasses ?? 0) + 1 };
      if (action.itemId === null) {
        return { ...state, chestsOpened, bonusShards: (state.bonusShards ?? 0) + CHEST_DUPLICATE_SHARDS };
      }
      const valid = chestPool(ownership(state, stats)).some((i) => i.id === action.itemId);
      if (!valid) return state;
      return { ...state, chestsOpened, wonCosmeticIds: [...(state.wonCosmeticIds ?? []), action.itemId] };
    }

    case 'PLAN_ADD': {
      const text = action.text.trim();
      if (!text) return state;
      const plan = normalizePlan(state.weekPlan);
      const note = action.note?.trim() || undefined;
      if (action.date && /^\d{4}-\d{2}-\d{2}$/.test(action.date)) {
        const event: PlanItem = { id: planId(), text, time: cleanTime(action.time), category: action.category, date: action.date, note };
        return { ...state, weekPlan: { ...plan, events: [...(plan.events ?? []), event] } };
      }
      return withPlanDay(state, action.day, [...plan.days[action.day], { id: planId(), text, time: cleanTime(action.time), category: action.category, note }]);
    }

    case 'PLAN_UPDATE': {
      const text = action.text.trim();
      if (!text) return state;
      const plan = normalizePlan(state.weekPlan);
      const note = action.note?.trim() || undefined;
      if ((plan.events ?? []).some((e) => e.id === action.itemId)) {
        const events = (plan.events ?? []).map((e) =>
          e.id === action.itemId ? { ...e, text, time: cleanTime(action.time), category: action.category, note, date: action.date || e.date } : e,
        );
        return { ...state, weekPlan: { ...plan, events } };
      }
      return withPlanDay(
        state,
        action.day,
        plan.days[action.day].map((i) => (i.id === action.itemId ? { ...i, text, time: cleanTime(action.time), category: action.category, note } : i)),
      );
    }

    case 'PLAN_DELETE': {
      const plan = normalizePlan(state.weekPlan);
      const next = withPlanDay(state, action.day, plan.days[action.day].filter((i) => i.id !== action.itemId));
      return {
        ...next,
        weekPlan: {
          ...next.weekPlan,
          events: (plan.events ?? []).filter((e) => e.id !== action.itemId),
          checkedIds: next.weekPlan.checkedIds.filter((id) => id !== action.itemId),
        },
      };
    }

    case 'PLAN_TOGGLE': {
      const plan = normalizePlan(state.weekPlan);
      const wk = weekKey();
      const current = plan.checkedWeekKey === wk ? plan.checkedIds : [];
      const checkedIds = current.includes(action.itemId)
        ? current.filter((id) => id !== action.itemId)
        : [...current, action.itemId];
      return { ...state, weekPlan: { ...plan, checkedWeekKey: wk, checkedIds } };
    }

    case 'PLAN_COPY_DAY': {
      const plan = normalizePlan(state.weekPlan);
      const source = plan.days[action.from];
      const days = { ...plan.days };
      for (const day of action.to) {
        if (day === action.from) continue;
        const existing = days[day];
        // Skip entries that are already on that day so copying twice doesn't duplicate.
        const additions = source
          .filter((s) => !existing.some((e) => e.text === s.text && (e.time ?? '') === (s.time ?? '')))
          .map((s) => ({ ...s, id: planId() }));
        days[day] = [...existing, ...additions];
      }
      return { ...state, weekPlan: { ...plan, days } };
    }

    case 'PLAN_LOAD_STARTER': {
      // Only fills days that are still empty, so it can never wipe something the user wrote.
      const plan = normalizePlan(state.weekPlan);
      const days = { ...plan.days };
      for (const day of Object.keys(days) as WeekdayId[]) {
        if (days[day].length === 0) days[day] = (action.days[day] ?? []).map((i) => ({ ...i, id: planId() }));
      }
      return { ...state, weekPlan: { ...plan, days } };
    }

    case 'PLAN_CLEAR_DAY': {
      const plan = normalizePlan(state.weekPlan);
      const removed = new Set(plan.days[action.day].map((i) => i.id));
      const next = withPlanDay(state, action.day, []);
      return { ...next, weekPlan: { ...next.weekPlan, checkedIds: plan.checkedIds.filter((id) => !removed.has(id)) } };
    }

    case 'MONEY_SETUP': {
      const names: Record<MoneyKind, string> = { spending: 'Wallet', savings: 'Savings', investing: 'Investments' };
      return withMoney(state, (m) => ({
        ...m,
        currency: action.currency,
        setupDone: true,
        accounts: (['spending', 'savings', 'investing'] as MoneyKind[]).map((kind) => ({
          id: moneyId('acct'),
          name: names[kind],
          kind,
          amount: Math.max(0, action.amounts[kind] || 0),
        })),
      }));
    }

    case 'MONEY_SET_CURRENCY':
      return withMoney(state, (m) => ({ ...m, currency: action.currency }));

    case 'MONEY_UPSERT_ACCOUNT': {
      const { id, ...rest } = action.account;
      const name = rest.name.trim() || 'Account';
      return withMoney(state, (m) => ({
        ...m,
        setupDone: true,
        accounts: id
          ? m.accounts.map((a) => (a.id === id ? { ...a, ...rest, name } : a))
          : [...m.accounts, { ...rest, name, id: moneyId('acct') }],
      }));
    }

    case 'MONEY_DELETE_ACCOUNT':
      return withMoney(state, (m) => ({
        ...m,
        accounts: m.accounts.filter((a) => a.id !== action.accountId),
        goals: m.goals.filter((g) => g.accountId !== action.accountId),
      }));

    case 'MONEY_TRANSFER': {
      if (action.amount <= 0 || action.fromId === action.toId) return state;
      return withMoney(state, (m) => ({
        ...m,
        accounts: adjustAccount(adjustAccount(m.accounts, action.fromId, -action.amount), action.toId, action.amount),
      }));
    }

    case 'MONEY_ADD_EXPENSE': {
      if (action.amount <= 0) return state;
      return withMoney(state, (m) => ({
        ...m,
        accounts: adjustAccount(m.accounts, action.accountId, -action.amount),
        expenses: [
          ...m.expenses,
          {
            id: moneyId('exp'),
            date: todayKey(),
            amount: action.amount,
            categoryId: action.categoryId,
            accountId: action.accountId,
            note: action.note?.trim() || undefined,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    }

    case 'MONEY_DELETE_EXPENSE': {
      return withMoney(state, (m) => {
        const exp = m.expenses.find((e) => e.id === action.expenseId);
        if (!exp) return m;
        return {
          ...m,
          accounts: adjustAccount(m.accounts, exp.accountId, exp.amount),
          expenses: m.expenses.filter((e) => e.id !== action.expenseId),
        };
      });
    }

    case 'MONEY_UPSERT_GOAL': {
      return withMoney(state, (m) => {
        let accounts = m.accounts;
        let accountId = action.goal.accountId;
        if (action.newAccount) {
          accountId = moneyId('acct');
          // Money moved in from an existing account leaves that account, so the total isn't counted twice.
          if (action.newAccount.fromAccountId) {
            accounts = adjustAccount(accounts, action.newAccount.fromAccountId, -Math.max(0, action.newAccount.amount));
          }
          accounts = [
            ...accounts,
            { id: accountId, name: action.newAccount.name.trim() || 'Goal fund', kind: 'savings', amount: Math.max(0, action.newAccount.amount) },
          ];
        }
        if (!accountId || !accounts.some((a) => a.id === accountId)) return m;
        const { id, ...rest } = action.goal;
        const goal = { ...rest, name: rest.name.trim() || 'Goal', accountId };
        const goals = id
          ? m.goals.map((g) => (g.id === id ? { ...g, ...goal } : g))
          : [...m.goals, { ...goal, id: moneyId('goal'), createdAt: new Date().toISOString() }];
        return { ...m, accounts, goals };
      });
    }

    case 'MONEY_DELETE_GOAL':
      // The money itself stays in its savings account; only the goal is removed.
      return withMoney(state, (m) => ({ ...m, goals: m.goals.filter((g) => g.id !== action.goalId) }));

    case 'MONEY_SET_CATEGORIES':
      return withMoney(state, (m) => ({ ...m, categories: action.categories }));

    case 'COMPLETE_ONBOARDING': {
      const plan = normalizePlan(state.weekPlan);
      const days = { ...plan.days };
      for (const day of Object.keys(days) as WeekdayId[]) {
        if (days[day].length === 0) days[day] = (action.plan[day] ?? []).map((i) => ({ ...i, id: planId() }));
      }
      // Start small: 4 daily quests that match what they want to work on. The rest stay in the list
      // (paused) and can be switched on any time in Settings → Quests.
      const keep = new Set(starterQuestTitles(action.profile.focusAreas));
      const quests = state.quests.map((q) =>
        q.frequency === 'daily' && !q.custom && !q.wildcardDate ? { ...q, archived: !keep.has(q.title) } : q,
      );
      return { ...state, onboarded: true, profile: action.profile, weekPlan: { ...plan, days }, quests, wildcardEnabled: false };
    }

    case 'SET_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.profile } };

    case 'SET_PREFS':
      return { ...state, prefs: { ...DEFAULT_PREFS, ...(state.prefs ?? {}), ...action.prefs } };

    case 'SET_DIARY': {
      // The diary page for a day is the same text as that day's note on the Today screen.
      const existing = state.dayLogs[action.date];
      const freeNote = action.text;
      if (!existing && !freeNote.trim()) return state;
      const log = existing
        ? { ...existing, freeNote }
        : { date: action.date, completedQuestIds: [], xpEarned: 0, perfectDay: false, dailyQuestCount: 0, freeNote };
      return { ...state, dayLogs: { ...state.dayLogs, [action.date]: log } };
    }

    case 'UPSERT_NOTE': {
      const now = new Date().toISOString();
      const notes = state.notes ?? [];
      if (action.note.id && notes.some((n) => n.id === action.note.id)) {
        return { ...state, notes: notes.map((n) => (n.id === action.note.id ? { ...n, ...action.note, updatedAt: now } : n)) };
      }
      const note: NoteEntry = {
        id: action.note.id ?? `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: action.note.title ?? '',
        body: action.note.body ?? '',
        pinned: action.note.pinned ?? false,
        color: action.note.color ?? 'none',
        createdAt: now,
        updatedAt: now,
      };
      return { ...state, notes: [note, ...notes] };
    }

    case 'DELETE_NOTE':
      return { ...state, notes: (state.notes ?? []).filter((n) => n.id !== action.noteId) };

    case 'SET_APPEARANCE':
      return { ...state, appearance: { ...(state.appearance ?? { accent: 'cyber', background: 'nebula' }), ...action.appearance, chosen: true } };

    case 'SET_MOOD': {
      const moods = { ...(state.moods ?? {}) };
      if (action.mood === null) delete moods[action.date];
      else moods[action.date] = action.mood;
      return { ...state, moods };
    }

    case 'SET_MEASURE': {
      const quest = state.quests.find((q) => q.id === action.questId);
      if (!quest?.measure || action.measure.unit !== quest.measure.unit || !(action.measure.target > 0)) return state;
      const before = currentProgress(state, quest);
      const oldSize = quest.measure.size ?? 250;
      const newSize = action.measure.size ?? 250;
      const updated = { ...quest, measure: { ...action.measure } };
      // "Drink 2L of water" follows a new daily goal (e.g. 2.5L).
      if (quest.measure.unit === 'glasses' && /\d+([.,]\d+)?\s?L\b/.test(quest.title)) {
        const l = Math.round(((action.measure.size ?? 250) * action.measure.target) / 100) / 10;
        updated.title = quest.title.replace(/\d+([.,]\d+)?\s?L\b/, `${l}L`);
      } else if (quest.measure.unit !== 'glasses' && quest.measure.target !== action.measure.target) {
        // "Walk 10,000 steps" → "Walk 8,000 steps" (only when the old goal is written in the title).
        const t = quest.measure.target;
        const forms = [t.toLocaleString('en-US'), String(t), t.toLocaleString('de-DE')];
        const hit = forms.find((f) => new RegExp(`(^|\\D)${f.replace(/[.,]/g, '\\$&')}(?!\\d)`).test(quest.title));
        if (hit) {
          const nt = action.measure.target;
          const repl = hit.includes(',') ? nt.toLocaleString('en-US') : hit.includes('.') && t >= 1000 ? nt.toLocaleString('de-DE') : String(nt);
          updated.title = quest.title.replace(hit, repl);
        }
      }
      let next: AppState = { ...state, quests: state.quests.map((q) => (q.id === quest.id ? updated : q)) };
      // Same amount of water drunk, counted in the new glass size.
      const value = quest.measure.unit === 'glasses' && oldSize !== newSize ? Math.round((before * oldSize) / newSize) : before;
      next = withProgress(next, updated, value);
      return next;
    }

    case 'SET_PROGRESS': {
      const quest = state.quests.find((q) => q.id === action.questId);
      if (!quest?.measure) return state;
      return withProgress(state, quest, Math.max(0, action.value));
    }

    case 'ADD_RUN': {
      if (!(action.km > 0)) return state;
      const km = Math.round(action.km * 100) / 100;
      const run: RunRecord = { id: `run-${Date.now()}`, date: todayKey(), km, seconds: Math.max(0, Math.round(action.seconds)), source: action.source };
      let next: AppState = { ...state, runs: [...(state.runs ?? []), run] };
      // A run counts toward every active distance quest, daily and weekly.
      for (const q of next.quests.filter((x) => x.measure?.unit === 'km' && !x.archived)) {
        next = withProgress(next, q, currentProgress(next, q) + km);
      }
      return next;
    }

    case 'DELETE_RUN': {
      const run = (state.runs ?? []).find((r) => r.id === action.runId);
      if (!run) return state;
      let next: AppState = { ...state, runs: (state.runs ?? []).filter((r) => r.id !== action.runId) };
      if (run.date === todayKey() || run.date >= mondayKey()) {
        for (const q of next.quests.filter((x) => x.measure?.unit === 'km' && !x.archived)) {
          const applies = q.frequency === 'weekly' ? run.date >= mondayKey() : run.date === todayKey();
          if (applies) next = withProgress(next, q, Math.max(0, currentProgress(next, q) - run.km));
        }
      }
      return next;
    }

    case 'OPEN_DAILY_BOX': {
      const today = todayKey();
      const log = state.dayLogs[today];
      if (state.dailyBox?.lastOpened === today || !log || doneByHand(log) === 0) return state;
      let next: AppState = { ...state, dailyBox: { lastOpened: today, lastReward: action.reward } };
      const r = action.reward;
      switch (r.kind) {
        case 'shards':
          next = { ...next, bonusShards: (next.bonusShards ?? 0) + Math.max(0, Math.min(500, r.amount)) };
          break;
        case 'xpBoost': {
          const boost = Math.max(log.xpBoost ?? 1, Math.min(2, r.multiplier));
          next = { ...next, dayLogs: { ...next.dayLogs, [today]: recomputeDailyLog(next.quests, log.completedQuestIds, { ...log, xpBoost: boost }) } };
          break;
        }
        case 'swap':
          next = { ...next, questSwaps: (next.questSwaps ?? 0) + 1 };
          break;
        case 'shield':
          next = { ...next, streakShields: (next.streakShields ?? 0) + 1 };
          break;
        case 'skip':
          next = { ...next, skipPasses: (next.skipPasses ?? 0) + 1 };
          break;
        case 'chest':
          next = { ...next, bonusChests: (next.bonusChests ?? 0) + 1 };
          break;
        case 'cosmetic': {
          const stats = computeDerivedStats(state);
          if (!boxPool(ownership(state, stats)).some((i) => i.id === r.itemId)) return state;
          next = { ...next, wonCosmeticIds: [...(next.wonCosmeticIds ?? []), r.itemId] };
          break;
        }
      }
      return next;
    }

    case 'USE_QUEST_SWAP': {
      const quest = state.quests.find((q) => q.id === action.questId);
      const today = todayKey();
      const log = state.dayLogs[today];
      if (!quest || quest.frequency !== 'daily' || (state.questSwaps ?? 0) <= 0) return state;
      if (log?.completedQuestIds.includes(quest.id) || log?.swaps?.[quest.id]) return state;
      const swaps = { ...(log?.swaps ?? {}), [quest.id]: action.replacement };
      return {
        ...state,
        questSwaps: (state.questSwaps ?? 0) - 1,
        dayLogs: { ...state.dayLogs, [today]: recomputeDailyLog(state.quests, log?.completedQuestIds ?? [], { ...log, swaps }) },
      };
    }

    case 'USE_SKIP_PASS': {
      const quest = state.quests.find((q) => q.id === action.questId);
      const today = todayKey();
      const log = state.dayLogs[today];
      if (!quest || quest.frequency !== 'daily' || quest.archived || (state.skipPasses ?? 0) <= 0) return state;
      if (log?.completedQuestIds.includes(quest.id)) return state;
      const skipped = [...(log?.skipped ?? []), quest.id];
      return {
        ...state,
        skipPasses: (state.skipPasses ?? 0) - 1,
        dayLogs: { ...state.dayLogs, [today]: recomputeDailyLog(state.quests, log?.completedQuestIds ?? [], { ...log, skipped }) },
      };
    }

    case 'MONEY_UPSERT_CRYPTO': {
      const h = action.holding;
      if (!h.coinId || !(h.amount >= 0)) return state;
      return withMoney(state, (m) => {
        const list = m.crypto ?? [];
        const id = h.id ?? moneyId('coin');
        const item = { ...h, id };
        return { ...m, crypto: list.some((c) => c.id === id) ? list.map((c) => (c.id === id ? item : c)) : [...list, item] };
      });
    }

    case 'MONEY_DELETE_CRYPTO':
      return withMoney(state, (m) => ({ ...m, crypto: (m.crypto ?? []).filter((c) => c.id !== action.holdingId) }));

    case 'MONEY_SET_CRYPTO_PRICES':
      return withMoney(state, (m) => ({ ...m, cryptoPrices: action.prices }));

    case 'MONEY_UPSERT_BILL': {
      const b = action.bill;
      if (!b.name.trim() || !(b.amount > 0)) return state;
      return withMoney(state, (m) => {
        const list = m.bills ?? [];
        const id = b.id ?? moneyId('bill');
        const item = { ...b, id, name: b.name.trim(), day: Math.min(31, Math.max(1, Math.round(b.day || 1))) };
        return { ...m, bills: list.some((x) => x.id === id) ? list.map((x) => (x.id === id ? item : x)) : [...list, item] };
      });
    }

    case 'MONEY_SET_INCOME':
      return withMoney(state, (m) => ({ ...m, income: action.income, saveRate: action.saveRate ?? m.saveRate }));

    case 'MONEY_UPSERT_WISH': {
      const w = action.wish;
      if (!w.name.trim() || !(w.price > 0)) return state;
      return withMoney(state, (m) => {
        const list = m.wishlist ?? [];
        const old = w.id ? list.find((x) => x.id === w.id) : undefined;
        const link = w.link?.trim() ? (/^https?:\/\//i.test(w.link.trim()) ? w.link.trim() : `https://${w.link.trim()}`) : undefined;
        const item: WishItem = { id: old?.id ?? moneyId('wish'), name: w.name.trim(), price: Math.round(w.price), icon: w.icon || '🎁', link, addedAt: old?.addedAt ?? todayKey() };
        return { ...m, wishlist: old ? list.map((x) => (x.id === old.id ? item : x)) : [...list, item] };
      });
    }

    case 'MONEY_DELETE_WISH':
      return withMoney(state, (m) => ({ ...m, wishlist: (m.wishlist ?? []).filter((x) => x.id !== action.wishId) }));

    case 'MONEY_DELETE_BILL':
      return withMoney(state, (m) => ({ ...m, bills: (m.bills ?? []).filter((x) => x.id !== action.billId) }));

    case 'CHECK_STREAK_SHIELDS': {
      let shields = state.streakShields ?? 0;
      if (shields <= 0) return state;
      const shielded = new Set(state.shieldedDates ?? []);
      // A rest day (one missed day in any 7) already keeps the streak: don't spend a shield on it.
      const rest = graceDays(state.dayLogs, shielded);
      const good = (k: string) => shielded.has(k) || rest.has(k) || dayCountsForStreak(state.dayLogs[k]);
      // Walk back over missed days (yesterday first), as far as the shields go.
      const missed: string[] = [];
      let cursor = addDaysToKey(todayKey(), -1);
      while (!good(cursor) && missed.length < shields && missed.length < 7) {
        missed.push(cursor);
        cursor = addDaysToKey(cursor, -1);
      }
      // Only spend shields if there's a streak behind the gap to protect.
      if (missed.length === 0 || !good(cursor)) return state;
      shields -= missed.length;
      return { ...state, streakShields: shields, shieldedDates: [...(state.shieldedDates ?? []), ...missed] };
    }

    case 'ADD_FOCUS_MINUTES': {
      if (action.minutes <= 0) return state;
      const focusMinutes = { ...(state.focusMinutes ?? {}) };
      focusMinutes[action.date] = (focusMinutes[action.date] ?? 0) + action.minutes;
      return { ...state, focusMinutes };
    }

    case 'IMPORT_STATE': {
      // Backups from before first-run setup existed belong to existing users, so never re-run setup for them.
      const merged = { ...createInitialState(), ...action.state, onboarded: action.state.onboarded ?? true, contentVersion: action.state.contentVersion ?? 1 };
      return migrateContent({ ...merged, character: normalizeLook(merged.character) });
    }

    case 'RESET_ALL': {
      return createInitialState();
    }

    default:
      return state;
  }
}
