import { useEffect } from 'react';
import type { Appearance } from './types';

export const ACCENTS: Array<{ id: Appearance['accent']; label: string; hex: string }> = [
  { id: 'squzo', label: 'Squzo blue', hex: '#22c3ee' },
  { id: 'flame', label: 'Flame', hex: '#ff7a2e' },
  { id: 'cyber', label: 'Cyber', hex: '#22d3ee' },
  { id: 'amber', label: 'Amber', hex: '#f59e0b' },
  { id: 'ocean', label: 'Ocean', hex: '#3b82f6' },
  { id: 'emerald', label: 'Emerald', hex: '#10b981' },
  { id: 'violet', label: 'Violet', hex: '#8b5cf6' },
  { id: 'rose', label: 'Rose', hex: '#f43f5e' },
  { id: 'sunset', label: 'Sunset', hex: '#f97316' },
  { id: 'pink', label: 'Bubblegum', hex: '#ec4899' },
  { id: 'teal', label: 'Lagoon', hex: '#14b8a6' },
  { id: 'lime', label: 'Lime', hex: '#84cc16' },
  { id: 'indigo', label: 'Indigo', hex: '#6366f1' },
];

export const BACKGROUNDS: Array<{ id: Appearance['background']; label: string; hint: string; bg: string; surface: string; glow?: string }> = [
  { id: 'obsidian', label: 'Obsidian', hint: 'Warm dark, a new glow on every tab', bg: '#0c0a09', surface: '#211b17', glow: 'radial-gradient(90% 70% at 50% 0%, rgba(34,211,238,.45), transparent 70%), radial-gradient(60% 50% at 100% 100%, rgba(37,99,235,.3), transparent 70%)' },
  { id: 'nebula', label: 'Nebula', hint: 'Futuristic glow', bg: '#05060b', surface: '#171b2e', glow: 'radial-gradient(80% 70% at 0% 0%, rgba(34,211,238,.45), transparent 70%), radial-gradient(70% 70% at 100% 0%, rgba(168,85,247,.5), transparent 70%)' },
  { id: 'aurora', label: 'Aurora', hint: 'Northern lights', bg: '#04100f', surface: '#13272a', glow: 'radial-gradient(80% 70% at 20% 0%, rgba(52,211,153,.5), transparent 70%), radial-gradient(70% 70% at 100% 0%, rgba(139,92,246,.5), transparent 70%)' },
  { id: 'ember', label: 'Ember', hint: 'Warm sunset glow', bg: '#110806', surface: '#2a1816', glow: 'radial-gradient(80% 70% at 0% 0%, rgba(249,115,22,.55), transparent 70%), radial-gradient(70% 70% at 100% 0%, rgba(236,72,153,.45), transparent 70%)' },
  { id: 'deepsea', label: 'Deep sea', hint: 'Calm blue depths', bg: '#030a18', surface: '#13213f', glow: 'radial-gradient(90% 70% at 50% 0%, rgba(59,130,246,.55), transparent 70%), radial-gradient(60% 60% at 0% 100%, rgba(34,211,238,.3), transparent 70%)' },
  { id: 'candy', label: 'Candy', hint: 'Pink & lilac dream', bg: '#0f0614', surface: '#281733', glow: 'radial-gradient(80% 70% at 0% 0%, rgba(244,114,182,.55), transparent 70%), radial-gradient(70% 70% at 100% 0%, rgba(167,139,250,.5), transparent 70%)' },
  { id: 'graphite', label: 'Graphite', hint: 'Clean & neutral', bg: '#0c0d11', surface: '#1d2027' },
  { id: 'midnight', label: 'Midnight', hint: 'Deep navy, dotted', bg: '#0b0e17', surface: '#1b2038' },
  { id: 'black', label: 'Black', hint: 'True black, saves battery', bg: '#000000', surface: '#18191d' },
];

const KEY = 'dayforge-appearance';

/** Puts the chosen theme on <html> (CSS does the rest) and remembers it for the next launch. */
export function useApplyAppearance(appearance: Appearance | undefined) {
  const accent = appearance?.accent ?? 'squzo';
  const background = appearance?.background ?? 'obsidian';
  useEffect(() => {
    const root = document.documentElement;
    if (accent === 'amber') delete root.dataset.accent;
    else root.dataset.accent = accent;
    root.dataset.bg = background;
    const bg = BACKGROUNDS.find((b) => b.id === background)?.bg ?? '#0c0a09';
    if (root.dataset.theme !== 'light') document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
    try {
      localStorage.setItem(KEY, JSON.stringify({ accent, background }));
    } catch {
      // storage unavailable; the theme still applies for this session
    }
  }, [accent, background]);
}
