import type { Mood } from './types';

export const MOODS: Array<{ value: Mood; icon: string; label: string; color: string; chosen: string }> = [
  { value: 1, icon: '😞', label: 'Awful', color: 'text-rose-400', chosen: 'border-rose-400 bg-rose-500/15 shadow-[0_6px_20px_-8px_rgba(251,113,133,0.8)]' },
  { value: 2, icon: '😕', label: 'Bad', color: 'text-orange-400', chosen: 'border-orange-400 bg-orange-500/15 shadow-[0_6px_20px_-8px_rgba(251,146,60,0.8)]' },
  { value: 3, icon: '😐', label: 'Okay', color: 'text-yellow-300', chosen: 'border-yellow-300 bg-yellow-400/15 shadow-[0_6px_20px_-8px_rgba(253,224,71,0.7)]' },
  { value: 4, icon: '🙂', label: 'Good', color: 'text-lime-300', chosen: 'border-lime-300 bg-lime-400/15 shadow-[0_6px_20px_-8px_rgba(190,242,100,0.7)]' },
  { value: 5, icon: '😄', label: 'Great', color: 'text-emerald-300', chosen: 'border-emerald-300 bg-emerald-400/15 shadow-[0_6px_20px_-8px_rgba(110,231,183,0.7)]' },
];
