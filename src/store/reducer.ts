import type { AppState, CosmeticSlot, DayLog, Difficulty, Frequency, GoalTimeframe, LongTermGoal, PlanCategory, PlanItem, Quest, WeekLog, WeekPlan, WeekdayId, MoneyAccount, Mood, Profile, Appearance, MoneyKind, MoneyState, SavingsGoal, SpendCategory } from '../lib/types';
import { todayKey, weekKey } from '../lib/date';
import { buildDefaultQuests } from '../data/defaultQuests';
import { buildDefaultGoals } from '../data/defaultGoals';
import { buildWildcardQuestForDate, buildWeeklyWildcardQuestForWeek } from '../lib/wildcard';
import { DIFFICULTY_XP } from '../lib/xp';
import { questReward } from '../lib/rewards';
import { CHEST_DUPLICATE_SHARDS, DEFAULT_LOOK, chestPool, findItem, isOwned, normalizeLook, type OwnershipContext } from '../data/avatar';
import { computeDerivedStats } from '../lib/stats';
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
    appearance: { accent: 'amber', background: 'graphite' },
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
  | { type: 'OPEN_CHEST'; itemId: string | null }
  | { type: 'SET_QUEST_NOTE'; questId: string; note: string }
  | { type: 'SET_FREE_NOTE'; note: string }
  | { type: 'ADD_QUICK_TASK'; text: string }
  | { type: 'TOGGLE_QUICK_TASK'; taskId: string }
  | { type: 'DELETE_QUICK_TASK'; taskId: string }
  | { type: 'PLAN_ADD'; day: WeekdayId; text: string; time?: string; category?: PlanCategory }
  | { type: 'PLAN_UPDATE'; day: WeekdayId; itemId: string; text: string; time?: string; category?: PlanCategory }
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
  | { type: 'ADD_FOCUS_MINUTES'; date: string; minutes: number }
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
function recomputeDailyLog(quests: Quest[], completedQuestIds: string[], existing?: Partial<DayLog>): DayLog {
  // The wildcard quest is a bonus and doesn't count toward the "perfect day" requirement.
  const activeDaily = quests.filter((q) => q.frequency === 'daily' && !q.archived && !q.wildcardDate);
  const dateKey = todayKey();
  const xpEarned = completedQuestIds.reduce((sum, id) => {
    const q = quests.find((x) => x.id === id);
    return sum + (q ? questReward(dateKey, id, q.xp).xp : 0);
  }, 0);
  const perfectDay = activeDaily.length > 0 && activeDaily.every((q) => completedQuestIds.includes(q.id));
  return {
    ...existing,
    date: dateKey,
    completedQuestIds,
    xpEarned,
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
      const hasContent = action.note.trim().length > 0;

      if (quest.frequency === 'daily') {
        const key = todayKey();
        const existing = state.dayLogs[key];
        const completed = existing ? [...existing.completedQuestIds] : [];
        const idx = completed.indexOf(quest.id);
        if (hasContent && idx < 0) completed.push(quest.id);
        if (!hasContent && idx >= 0) completed.splice(idx, 1);
        const notes = { ...(existing?.notes ?? {}) };
        if (hasContent) notes[quest.id] = action.note;
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
        if (hasContent) notes[quest.id] = action.note;
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

    case 'MARK_DAY_OPENED': {
      return { ...state, lastOpenedDate: action.date };
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
      return { ...state, unlockedCosmeticIds: [...state.unlockedCosmeticIds, action.itemId] };
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
      return withPlanDay(state, action.day, [...plan.days[action.day], { id: planId(), text, time: cleanTime(action.time), category: action.category }]);
    }

    case 'PLAN_UPDATE': {
      const text = action.text.trim();
      if (!text) return state;
      const plan = normalizePlan(state.weekPlan);
      return withPlanDay(
        state,
        action.day,
        plan.days[action.day].map((i) => (i.id === action.itemId ? { ...i, text, time: cleanTime(action.time), category: action.category } : i)),
      );
    }

    case 'PLAN_DELETE': {
      const plan = normalizePlan(state.weekPlan);
      const next = withPlanDay(state, action.day, plan.days[action.day].filter((i) => i.id !== action.itemId));
      return { ...next, weekPlan: { ...next.weekPlan, checkedIds: next.weekPlan.checkedIds.filter((id) => id !== action.itemId) } };
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
      return { ...state, onboarded: true, profile: action.profile, weekPlan: { ...plan, days } };
    }

    case 'SET_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.profile } };

    case 'SET_APPEARANCE':
      return { ...state, appearance: { ...(state.appearance ?? { accent: 'amber', background: 'graphite' }), ...action.appearance } };

    case 'SET_MOOD': {
      const moods = { ...(state.moods ?? {}) };
      if (action.mood === null) delete moods[action.date];
      else moods[action.date] = action.mood;
      return { ...state, moods };
    }

    case 'ADD_FOCUS_MINUTES': {
      if (action.minutes <= 0) return state;
      const focusMinutes = { ...(state.focusMinutes ?? {}) };
      focusMinutes[action.date] = (focusMinutes[action.date] ?? 0) + action.minutes;
      return { ...state, focusMinutes };
    }

    case 'IMPORT_STATE': {
      // Backups from before first-run setup existed belong to existing users, so never re-run setup for them.
      const merged = { ...createInitialState(), ...action.state, onboarded: action.state.onboarded ?? true };
      return { ...merged, character: normalizeLook(merged.character) };
    }

    case 'RESET_ALL': {
      return createInitialState();
    }

    default:
      return state;
  }
}
