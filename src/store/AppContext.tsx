import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import type { AppState } from '../lib/types';
import { reducer, createInitialState, type Action } from './reducer';
import { computeDerivedStats } from '../lib/stats';
import { ACHIEVEMENTS } from '../data/achievements';
import { todayKey } from '../lib/date';

const STORAGE_KEY = 'daily-quest-app-state-v1';

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.quests)) {
      return createInitialState();
    }
    return parsed as AppState;
  } catch {
    return createInitialState();
  }
}

export type Celebration =
  | { kind: 'achievement'; id: string; title: string; description: string; icon: string }
  | { kind: 'levelup'; level: number; title: string }
  | { kind: 'goal'; id: string; title: string; icon: string };

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  stats: ReturnType<typeof computeDerivedStats>;
  celebrations: Celebration[];
  dismissCelebration: () => void;
  isNewDay: boolean;
  dismissNewDay: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const stats = useMemo(() => computeDerivedStats(state), [state]);

  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const prevLevelRef = useRef<number | null>(null);
  const celebratedAchievementIdsRef = useRef<Set<string>>(
    new Set(state.unlockedAchievements.map((u) => u.id)),
  );
  const prevGoalsCompletedRef = useRef<Set<string> | null>(null);

  const [isNewDay, setIsNewDay] = useState(() => state.lastOpenedDate !== todayKey());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full or unavailable; ignore, in-memory state still works this session
    }
  }, [state]);

  // Level-up celebration
  useEffect(() => {
    if (prevLevelRef.current === null) {
      prevLevelRef.current = stats.level;
      return;
    }
    if (stats.level > prevLevelRef.current) {
      setCelebrations((c) => [
        ...c,
        { kind: 'levelup', level: stats.level, title: `Level ${stats.level}!` },
      ]);
    }
    prevLevelRef.current = stats.level;
  }, [stats.level]);

  // Achievement unlock detection. celebratedAchievementIdsRef is mutated
  // synchronously so this stays correct even under StrictMode's double-invoke.
  useEffect(() => {
    const newlyQualified = ACHIEVEMENTS.filter((a) => a.check(stats)).map((a) => a.id);
    const toCelebrate = newlyQualified.filter((id) => !celebratedAchievementIdsRef.current.has(id));
    if (toCelebrate.length > 0) {
      for (const id of toCelebrate) celebratedAchievementIdsRef.current.add(id);
      for (const id of toCelebrate) {
        const def = ACHIEVEMENTS.find((a) => a.id === id);
        if (def) {
          setCelebrations((c) => [
            ...c,
            { kind: 'achievement', id: def.id, title: def.title, description: def.description, icon: def.icon },
          ]);
        }
      }
      dispatch({ type: 'UNLOCK_ACHIEVEMENTS', ids: toCelebrate });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.totalQuestsCompleted, stats.longestStreak, stats.totalPerfectDays, stats.level, stats.goalsCompleted, stats.daysActive]);

  // Goal completion celebration
  useEffect(() => {
    const completedIds = new Set(state.goals.filter((g) => !!g.completedAt).map((g) => g.id));
    if (prevGoalsCompletedRef.current !== null) {
      for (const g of state.goals) {
        if (g.completedAt && !prevGoalsCompletedRef.current.has(g.id)) {
          setCelebrations((c) => [...c, { kind: 'goal', id: g.id, title: g.title, icon: g.icon }]);
        }
      }
    }
    prevGoalsCompletedRef.current = completedIds;
  }, [state.goals]);

  function dismissCelebration() {
    setCelebrations((c) => c.slice(1));
  }

  function dismissNewDay() {
    setIsNewDay(false);
    dispatch({ type: 'MARK_DAY_OPENED', date: todayKey() });
  }

  const value: AppContextValue = {
    state,
    dispatch,
    stats,
    celebrations,
    dismissCelebration,
    isNewDay,
    dismissNewDay,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
