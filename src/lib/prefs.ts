import { THEME_COLOR } from './theme';
import { useEffect, useSyncExternalStore } from 'react';
import type { Prefs } from './types';
import { DEFAULT_PREFS, LANGUAGES, translate, type TKey } from './i18n';
import { locale, setLocale, setTimeFormat } from './locale';
import { setSoundsEnabled } from './focusTimer';
import { useApp } from '../store/AppContext';

const THEME_KEY = 'dayforge-theme';
const READING_KEY = 'dayforge-reading';

export function fullPrefs(p: Partial<Prefs> | undefined): Prefs {
  return { ...DEFAULT_PREFS, ...(p ?? {}) };
}

const darkQuery = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function useSystemDark(): boolean {
  return useSyncExternalStore(
    (l) => {
      darkQuery?.addEventListener?.('change', l);
      return () => darkQuery?.removeEventListener?.('change', l);
    },
    () => darkQuery?.matches ?? true,
  );
}

export function resolvedTheme(theme: Prefs['theme'], systemDark: boolean): 'dark' | 'light' {
  return theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
}

const realVibrate = typeof navigator !== 'undefined' && navigator.vibrate ? navigator.vibrate.bind(navigator) : null;

function setHaptics(on: boolean) {
  if (!realVibrate) return;
  try {
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      writable: true,
      value: on ? realVibrate : () => false,
    });
  } catch {
    // some browsers won't let us replace it; vibration then simply stays on
  }
}

/**
 * Applies the Settings: language (all dates, numbers and words), light/dark theme, time format,
 * sounds, vibration and reduced motion. Runs once near the top of the app.
 */
export function useApplyPrefs(raw: Partial<Prefs> | undefined) {
  const prefs = fullPrefs(raw);
  const systemDark = useSystemDark();
  const theme = resolvedTheme(prefs.theme, systemDark);

  // Language and clock are needed while rendering, so set them before children draw.
  if (locale() !== prefs.language) setLocale(prefs.language);
  setTimeFormat(prefs.timeFormat);
  setSoundsEnabled(prefs.sounds);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') root.dataset.theme = 'light';
    else delete root.dataset.theme;
    const bg = THEME_COLOR[theme];
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
    try {
      localStorage.setItem(THEME_KEY, prefs.theme);
    } catch {
      // ignore
    }
  }, [theme, prefs.theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (prefs.reduceMotion) root.dataset.motion = 'reduce';
    else delete root.dataset.motion;
  }, [prefs.reduceMotion]);

  useEffect(() => {
    const root = document.documentElement;
    const reading = prefs.reading ?? 'normal';
    if (reading === 'normal') delete root.dataset.reading;
    else root.dataset.reading = reading;
    try {
      localStorage.setItem(READING_KEY, reading);
    } catch {
      // ignore
    }
  }, [prefs.reading]);

  useEffect(() => setHaptics(prefs.haptics), [prefs.haptics]);
}

const CODES = new Set(LANGUAGES.map((l) => l.code));

/** Translator for the language the app is showing right now. */
export function t(key: TKey, vars?: Record<string, string | number>): string {
  const l = locale();
  return translate(CODES.has(l) ? l : l.split('-')[0], key, vars);
}

/** True in Simple mode (the default): screens show only their main cards. */
export function useSimple(): boolean {
  const { state } = useApp();
  return state.prefs?.simple !== false;
}
