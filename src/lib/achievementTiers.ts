import type { AchievementTier } from './types';

/** Colours for the badge crests: a metal frame (light → dark), the plate inside and the icon. */
export const TIER_STYLES: Record<
  AchievementTier,
  { label: string; labelColor: string; frame: [string, string, string]; plate: [string, string]; icon: string; glow: string }
> = {
  bronze: { label: 'Bronze', labelColor: 'text-orange-300', frame: ['#f3c08a', '#c4773d', '#6e3515'], plate: ['#3a1e10', '#1c0e07'], icon: '#f6c79a', glow: 'rgba(201,132,68,0.55)' },
  silver: { label: 'Silver', labelColor: 'text-slate-200', frame: ['#ffffff', '#b9c2cf', '#5d6673'], plate: ['#2a313b', '#12161c'], icon: '#e8edf3', glow: 'rgba(203,210,220,0.5)' },
  gold: { label: 'Gold', labelColor: 'text-amber-300', frame: ['#fff2b0', '#f0b429', '#8a5a07'], plate: ['#3d2a06', '#1d1403'], icon: '#ffe27a', glow: 'rgba(251,191,36,0.6)' },
  platinum: { label: 'Platinum', labelColor: 'text-violet-300', frame: ['#f1ebff', '#a78bfa', '#4c2a9e'], plate: ['#25164d', '#110a26'], icon: '#ddd2ff', glow: 'rgba(167,139,250,0.6)' },
  legend: { label: 'Legend', labelColor: 'text-rose-300', frame: ['#ffd1dc', '#f43f5e', '#5b0a22'], plate: ['#2b0a16', '#12040a'], icon: '#ffe4ea', glow: 'rgba(244,63,94,0.6)' },
};

/** Order for showing tiers from lowest to highest. */
export const TIER_ORDER: AchievementTier[] = ['bronze', 'silver', 'gold', 'platinum', 'legend'];
