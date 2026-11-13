import { useEffect } from 'react';
import type { Appearance } from './types';

/**
 * Squzo has two looks only: Dark and Light (picked in Settings → Appearance, stored in prefs.theme).
 * The colours live in index.css. Older saves still carry an accent and background choice from when
 * there were many colour themes; we keep that data untouched (so nothing is lost) but no longer use it.
 */
export const THEME_COLOR = { dark: '#0b0d11', light: '#f4f6f8' } as const;

const KEY = 'dayforge-appearance';

/** Clears the old colour-theme markers from <html>, so every screen uses the one Squzo palette. */
export function useApplyAppearance(_appearance: Appearance | undefined) {
  useEffect(() => {
    const root = document.documentElement;
    delete root.dataset.accent;
    delete root.dataset.bg;
    if (root.dataset.theme !== 'light') document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR.dark);
    try {
      localStorage.removeItem(KEY);
    } catch {
      // storage unavailable; nothing to clean up
    }
  }, []);
}
