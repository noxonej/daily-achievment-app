import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, useCallback, type ReactNode } from 'react';
import type { AppState } from '../lib/types';
import { reducer, createInitialState, migrateContent, type Action } from './reducer';
import { normalizeLook } from '../data/avatar';
import { computeDerivedStats } from '../lib/stats';
import { ACHIEVEMENTS } from '../data/achievements';
import { todayKey } from '../lib/date';
import {
  loadSyncConfig,
  saveSyncConfig,
  clearSyncConfig,
  pushStateToGithub,
  pullStateFromGithub,
  type SyncConfig,
} from '../lib/githubSync';

/** Where an account's data lives; the original (pre-accounts) key is kept for the first account so nothing moves. */
export const LEGACY_STORAGE_KEY = 'daily-quest-app-state-v1';

function loadState(storageKey: string): AppState {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.quests)) {
      return createInitialState();
    }
    // Merge over fresh defaults so saves from before a schema change (new
    // fields like character/wildcardEnabled) don't crash on load.
    // Saves from before first-run setup existed are existing users: mark them onboarded.
    const merged = { ...createInitialState(), onboarded: true, contentVersion: 1, ...parsed } as AppState;
    // Older saves used a different character format; map them onto the current avatar slots.
    return migrateContent({ ...merged, character: normalizeLook(merged.character) });
  } catch {
    return createInitialState();
  }
}

export type Celebration =
  | { kind: 'achievement'; id: string; title: string; description: string; icon: string }
  | { kind: 'levelup'; level: number; title: string }
  | { kind: 'goal'; id: string; title: string; icon: string };

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  stats: ReturnType<typeof computeDerivedStats>;
  celebrations: Celebration[];
  dismissCelebration: () => void;
  isNewDay: boolean;
  dismissNewDay: () => void;
  syncConfig: SyncConfig | null;
  syncStatus: SyncStatus;
  syncMessage: string;
  connectSync: (cfg: SyncConfig) => Promise<void>;
  disconnectSync: () => void;
  syncNow: () => Promise<void>;
  restoreFromGithub: () => Promise<void>;
  /** Runs an action and offers a few seconds to undo it. */
  undoable: (action: Action, message: string) => void;
  undoToast: { id: number; message: string } | null;
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

  const [syncConfig, setSyncConfigState] = useState<SyncConfig | null>(() => loadSyncConfig());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const autoSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutoSyncRef = useRef(false);

  const recordSyncSuccess = useCallback((cfg: SyncConfig, message: string) => {
    const updated = { ...cfg, lastSyncedAt: new Date().toISOString() };
    saveSyncConfig(updated);
    setSyncConfigState((prev) => (prev ? { ...prev, lastSyncedAt: updated.lastSyncedAt } : prev));
    setSyncStatus('success');
    setSyncMessage(message);
  }, []);

  const connectSync = useCallback(
    async (cfg: SyncConfig) => {
      saveSyncConfig(cfg);
      setSyncConfigState(cfg);
      setSyncStatus('syncing');
      const result = await pushStateToGithub(cfg, state);
      if (result.ok) recordSyncSuccess(cfg, 'Connected and synced.');
      else {
        setSyncStatus('error');
        setSyncMessage(result.message);
      }
    },
    [state, recordSyncSuccess],
  );

  const disconnectSync = useCallback(() => {
    clearSyncConfig();
    setSyncConfigState(null);
    setSyncStatus('idle');
    setSyncMessage('');
  }, []);

  const syncNow = useCallback(async () => {
    if (!syncConfig) return;
    setSyncStatus('syncing');
    const result = await pushStateToGithub(syncConfig, state);
    if (result.ok) recordSyncSuccess(syncConfig, 'Synced just now.');
    else {
      setSyncStatus('error');
      setSyncMessage(result.message);
    }
  }, [syncConfig, state, recordSyncSuccess]);

  const restoreFromGithub = useCallback(async () => {
    if (!syncConfig) return;
    setSyncStatus('syncing');
    const result = await pullStateFromGithub(syncConfig);
    if (result.ok) {
      skipNextAutoSyncRef.current = true;
      dispatch({ type: 'IMPORT_STATE', state: result.data as AppState });
      setSyncStatus('success');
      setSyncMessage('Restored from GitHub.');
    } else {
      setSyncStatus('error');
      setSyncMessage(result.message);
    }
  }, [syncConfig]);

  // Debounced auto-sync: push a fresh copy a few seconds after the last change.
  useEffect(() => {
    if (!syncConfig?.autoSync) return;
    if (skipNextAutoSyncRef.current) {
      skipNextAutoSyncRef.current = false;
      return;
    }
    if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
    autoSyncTimerRef.current = setTimeout(async () => {
      setSyncStatus('syncing');
      const result = await pushStateToGithub(syncConfig, state);
      if (result.ok) recordSyncSuccess(syncConfig, 'Auto-synced.');
      else {
        setSyncStatus('error');
        setSyncMessage(result.message);
      }
    }, 4000);
    return () => {
      if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
    };
    // Only the identity of these primitives should restart the debounce timer —
    // recordSyncSuccess updates syncConfig.lastSyncedAt, which must not retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, syncConfig?.autoSync, syncConfig?.token, syncConfig?.owner, syncConfig?.repo, syncConfig?.path]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // storage full or unavailable; ignore, in-memory state still works this session
    }
  }, [state, storageKey]);

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

  // Ensure today's wildcard quest exists (or prune it if the feature is off).
  useEffect(() => {
    dispatch({ type: 'SYNC_WILDCARD' });
  }, [state.wildcardEnabled]);

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
    syncConfig,
    syncStatus,
    syncMessage,
    connectSync,
    disconnectSync,
    syncNow,
    restoreFromGithub,
    undoable,
    undoToast: undoToast ? { id: undoToast.id, message: undoToast.message } : null,
    undo,
    dismissUndo,
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
