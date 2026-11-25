import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, useCallback, type ReactNode } from 'react';
import type { AppState } from '../lib/types';
import { reducer, createInitialState, migrateContent, type Action } from './reducer';
import { normalizeLook } from '../data/avatar';
import { computeDerivedStats } from '../lib/stats';
import { ACHIEVEMENTS } from '../data/achievements';
import { todayKey } from '../lib/date';
import { giftFor } from '../lib/gifts';
import { rescueUnreadable, snapshotDaily, writeSave } from '../lib/safeStorage';

/** Where an account's data lives; the original (pre-accounts) key is kept for the first account so nothing moves. */
export const LEGACY_STORAGE_KEY = 'daily-quest-app-state-v1';

export function loadState(storageKey: string): AppState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(storageKey);
    if (!raw) return createInitialState();
    // One snapshot a day of what was saved before today's changes (Settings → Data can restore it).
    snapshotDaily(storageKey, raw);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.quests)) {
      // Unreadable or damaged: keep a copy aside before the fresh start is saved over it.
      rescueUnreadable(storageKey, raw);
      return createInitialState();
    }
    // Merge over fresh defaults so saves from before a schema change (new
    // fields like character/wildcardEnabled) don't crash on load.
    // Saves from before first-run setup existed are existing users: mark them onboarded.
    const merged = { ...createInitialState(), onboarded: true, contentVersion: 1, ...parsed } as AppState;
    // Older saves used a different character format; map them onto the current avatar slots.
    return migrateContent({ ...merged, character: normalizeLook(merged.character) });
  } catch {
    if (raw) rescueUnreadable(storageKey, raw);
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
  /** Runs an action and offers a few seconds to undo it. */
  undoable: (action: Action, message: string) => void;
  undoToast: { id: number; message: string } | null;
  /** True when the last change couldn't be written to the phone (storage full). */
  saveFailed: boolean;
  /** Where this account's data is saved (used by the restore-a-snapshot screen). */
  storageKey: string;
  undo: () => void;
  dismissUndo: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children, storageKey = LEGACY_STORAGE_KEY }: { children: ReactNode; storageKey?: string }) {
  const [state, dispatch] = useReducer(reducer, storageKey, loadState);
  const stats = useMemo(() => computeDerivedStats(state), [state]);

  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const prevLevelRef = useRef<number | null>(null);
  const celebratedAchievementIdsRef = useRef<Set<string>>(
    new Set(state.unlockedAchievements.map((u) => u.id)),
  );
  const prevGoalsCompletedRef = useRef<Set<string> | null>(null);

  const [isNewDay, setIsNewDay] = useState(() => state.lastOpenedDate !== todayKey());

  // One-off coin gifts for a linked Google account (each pays out once).
  useEffect(() => {
    let live = true;
    giftFor(storageKey).then((g) => {
      if (live && g) dispatch({ type: 'GIFT_COINS', id: g.id, amount: g.amount });
    });
    return () => {
      live = false;
    };
  }, [storageKey]);

  const [saveFailed, setSaveFailed] = useState(false);
  // Saving (2026-11-25): turning the whole save into text and writing it to the phone's storage
  // blocks the screen for a moment, and it used to happen on every single change: each letter typed
  // in a note, every step-count update. Now a burst of changes is saved once, 300 ms after the last
  // one, and straight away when the app is hidden or closed, so nothing is lost.
  const latest = useRef(state);
  latest.current = state;
  const dirty = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flushSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    if (!dirty.current) return;
    dirty.current = false;
    let json = '';
    try {
      json = JSON.stringify(latest.current);
    } catch {
      setSaveFailed(true);
      return;
    }
    // If the phone's storage is full the change still works this session, and the app says so.
    setSaveFailed(!writeSave(storageKey, json));
  }, [storageKey]);
  const firstSave = useRef(true);
  useEffect(() => {
    dirty.current = true;
    // The first save (right after loading, which may have migrated old data) is written at once.
    if (firstSave.current) {
      firstSave.current = false;
      flushSave();
      return;
    }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushSave, 300);
  }, [state, flushSave]);
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && flushSave();
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flushSave);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flushSave);
      // Switching accounts: save what's pending, unless this account was just deleted.
      try {
        if (localStorage.getItem(storageKey) !== null) flushSave();
      } catch {
        // ignore
      }
      clearTimeout(saveTimer.current);
    };
  }, [flushSave, storageKey]);

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

  // One-time plan items (appointments) disappear once their day is over: check on open and when the app comes back.
  useEffect(() => {
    const prune = () => dispatch({ type: 'PRUNE_PLAN_EVENTS', today: todayKey() });
    prune();
    const onVisible = () => document.visibilityState === 'visible' && prune();
    document.addEventListener('visibilitychange', onVisible);
    const t = setInterval(prune, 60 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(t);
    };
  }, []);

  // Ensure today's wildcard quest exists (or prune it if the feature is off).
  useEffect(() => {
    dispatch({ type: 'SYNC_WILDCARD' });
  }, [state.wildcardEnabled]);

  // Daily twists: some days a quest asks for a bit more, a bit less, or a different version.
  useEffect(() => {
    dispatch({ type: 'SYNC_DAILY_TWIST' });
  }, [state.lastOpenedDate, state.prefs?.dailyTwists]);

  // A Streak Shield quietly covers a missed yesterday when the app opens on a new day.
  useEffect(() => {
    dispatch({ type: 'CHECK_STREAK_SHIELDS' });
  }, [state.lastOpenedDate]);

  const [undoToast, setUndoToast] = useState<{ id: number; message: string; prev: AppState } | null>(null);
  const undoable = useCallback(
    (action: Action, message: string) => {
      setUndoToast({ id: Date.now(), message, prev: state });
      dispatch(action);
    },
    [state],
  );
  const undo = useCallback(() => {
    if (!undoToast) return;
    dispatch({ type: 'IMPORT_STATE', state: undoToast.prev });
    setUndoToast(null);
  }, [undoToast]);
  const dismissUndo = useCallback(() => setUndoToast(null), []);

  const value: AppContextValue = {
    state,
    dispatch,
    stats,
    celebrations,
    dismissCelebration,
    isNewDay,
    dismissNewDay,
    undoable,
    undoToast: undoToast ? { id: undoToast.id, message: undoToast.message } : null,
    undo,
    dismissUndo,
    saveFailed,
    storageKey,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/** Today's mood check-in (1–5) if there is one; safe to call outside the provider. */
export function useTodayMood(): number | undefined {
  const ctx = useContext(AppContext);
  return ctx?.state.moods?.[todayKey()];
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
