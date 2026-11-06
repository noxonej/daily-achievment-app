import { useEffect } from 'react';
import type { Appearance } from './types';

export const ACCENTS: Array<{ id: Appearance['accent']; label: string; hex: string }> = [
  { id: 'cyber', label: 'Cyber', hex: '#22d3ee' },
  { id: 'amber', label: 'Amber', hex: '#f59e0b' },
  { id: 'ocean', label: 'Ocean', hex: '#3b82f6' },
  { id: 'emerald', label: 'Emerald', hex: '#10b981' },
  { id: 'violet', label: 'Violet', hex: '#8b5cf6' },
  { id: 'rose', label: 'Rose', hex: '#f43f5e' },
];

export const BACKGROUNDS: Array<{ id: Appearance['background']; label: string; hint: string; bg: string; surface: string }> = [
  { id: 'nebula', label: 'Nebula', hint: 'Futuristic glow', bg: '#05060b', surface: '#171b2e' },
  { id: 'graphite', label: 'Graphite', hint: 'Clean & neutral', bg: '#0c0d11', surface: '#1d2027' },
  { id: 'midnight', label: 'Midnight', hint: 'Deep navy, dotted', bg: '#0b0e17', surface: '#1b2038' },
  { id: 'black', label: 'Black', hint: 'True black, saves battery', bg: '#000000', surface: '#18191d' },
];

const KEY = 'dayforge-appearance';

/** Puts the chosen theme on <html> (CSS does the rest) and remembers it for the next launch. */
export function useApplyAppearance(appearance: Appearance | undefined) {
  const accent = appearance?.accent ?? 'cyber';
  const background = appearance?.background ?? 'nebula';
  useEffect(() => {
    const root = document.documentElement;
    if (accent === 'amber') delete root.dataset.accent;
    else root.dataset.accent = accent;
    root.dataset.bg = background;
    const bg = BACKGROUNDS.find((b) => b.id === background)?.bg ?? '#05060b';
    if (root.dataset.theme !== 'light') document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
    try {
      localStorage.setItem(KEY, JSON.stringify({ accent, background }));
    } catch {
      // storage unavailable; the theme still applies for this session
    }
  }, [accent, background]);
}
