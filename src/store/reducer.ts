import type { AppState, DayLog, Difficulty, Frequency, GoalTimeframe, LongTermGoal, Quest, WeekLog } from '../lib/types';
import { todayKey, weekKey } from '../lib/date';
import { buildDefaultQuests } from '../data/defaultQuests';
import { buildDefaultGoals } from '../data/defaultGoals';
import { buildWildcardQuestForDate } from '../lib/wildcard';
import { DIFFICULTY_XP } from '../lib/xp';

export function createInitialState(): AppState {
  return {
    quests: buildDefaultQuests(),
    goals: buildDefaultGoals(),
    dayLogs: {},
    weekLogs: {},
    unlockedAchievements: [],
    lastOpenedDate: todayKey(),
    wildcardEnabled: true,
    createdAt: new Date().toISOString(),
  };
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
  | { type: 'IMPORT_STATE'; state: AppState }
  | { type: 'RESET_ALL' };

export interface NewQuestInput {
  title: string;
  description?: string;
  frequency: Frequency;
  difficulty: Difficulty;
  icon: string;
  category: string;
}

export interface NewGoalInput {
  title: string;
  description?: string;
  timeframe: GoalTimeframe;
  target: number;
  unit: string;
  icon: string;
}

function recomputeDailyLog(quests: Quest[], completedQuestIds: string[]): DayLog {
  // The wildcard quest is a bonus and doesn't count toward the "perfect day" requirement.
  const activeDaily = quests.filter((q) => q.frequency === 'daily' && !q.archived && !q.wildcardDate);
  const xpEarned = completedQuestIds.reduce((sum, id) => {
    const q = quests.find((x) => x.id === id);
    return sum + (q ? q.xp : 0);
  }, 0);
  const perfectDay = activeDaily.length > 0 && activeDaily.every((q) => completedQuestIds.includes(q.id));
  return {
    date: todayKey(),
    completedQuestIds,
    xpEarned,
    perfectDay,
    dailyQuestCount: activeDaily.length,
  };
}

function recomputeWeeklyLog(quests: Quest[], completedQuestIds: string[]): WeekLog {
  const activeWeekly = quests.filter((q) => q.frequency === 'weekly' && !q.archived);
  const xpEarned = completedQuestIds.reduce((sum, id) => {
    const q = quests.find((x) => x.id === id);
    return sum + (q ? q.xp : 0);
  }, 0);
  const perfectWeek = activeWeekly.length > 0 && activeWeekly.every((q) => completedQuestIds.includes(q.id));
  return {
    weekKey: weekKey(),
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
        const newLog = recomputeDailyLog(state.quests, completed);
        return { ...state, dayLogs: { ...state.dayLogs, [key]: newLog } };
      } else {
        const key = weekKey();
        const existing = state.weekLogs[key];
        const completed = existing ? [...existing.completedQuestIds] : [];
        const idx = completed.indexOf(quest.id);
        if (idx >= 0) completed.splice(idx, 1);
        else completed.push(quest.id);
        const newLog = recomputeWeeklyLog(state.quests, completed);
        return { ...state, weekLogs: { ...state.weekLogs, [key]: newLog } };
      }
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
      const withoutStaleWildcards = state.quests.filter((q) => !q.wildcardDate || q.wildcardDate === today);
      const hasToday = withoutStaleWildcards.some((q) => q.wildcardDate === today);
      if (!state.wildcardEnabled) {
        return withoutStaleWildcards.some((q) => !!q.wildcardDate)
          ? { ...state, quests: withoutStaleWildcards.filter((q) => !q.wildcardDate) }
          : state;
      }
      if (hasToday && withoutStaleWildcards.length === state.quests.length) return state;
      const quests = hasToday ? withoutStaleWildcards : [...withoutStaleWildcards, buildWildcardQuestForDate(today)];
      return { ...state, quests };
    }

    case 'SET_WILDCARD_ENABLED': {
      return { ...state, wildcardEnabled: action.enabled };
    }

    case 'IMPORT_STATE': {
      return { ...createInitialState(), ...action.state };
    }

    case 'RESET_ALL': {
      return createInitialState();
    }

    default:
      return state;
  }
}
