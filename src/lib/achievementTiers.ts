import type { AchievementTier } from './types';

export const TIER_STYLES: Record<
  AchievementTier,
  { gradient: string; glow: string; label: string; labelColor: string }
> = {
  bronze: {
    gradient: 'linear-gradient(145deg, #e0a565, #8a4a1f)',
    glow: 'shadow-[0_0_16px_-3px_rgba(201,132,68,0.65)]',
    label: 'Bronze',
    labelColor: 'text-[#e0a565]',
  },
  silver: {
    gradient: 'linear-gradient(145deg, #eef1f5, #8b95a3)',
    glow: 'shadow-[0_0_16px_-3px_rgba(203,210,220,0.6)]',
    label: 'Silver',
    labelColor: 'text-[#d3d9e0]',
  },
  gold: {
    gradient: 'linear-gradient(145deg, #ffe28f, #b8790f)',
    glow: 'shadow-[0_0_20px_-3px_rgba(251,191,36,0.75)]',
    label: 'Gold',
    labelColor: 'text-amber-300',
  },
  platinum: {
    gradient: 'linear-gradient(145deg, #e4ecff, #8b7cf6)',
    glow: 'shadow-[0_0_22px_-3px_rgba(167,139,250,0.7)]',
    label: 'Platinum',
    labelColor: 'text-violet-300',
  },
};
