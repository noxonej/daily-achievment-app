import type { Mood } from './types';

export const MOODS: Array<{ value: Mood; icon: string; label: string; color: string }> = [
  { value: 1, icon: '😞', label: 'Awful', color: 'text-rose-400' },
  { value: 2, icon: '😕', label: 'Bad', color: 'text-orange-400' },
  { value: 3, icon: '😐', label: 'Okay', color: 'text-yellow-300' },
  { value: 4, icon: '🙂', label: 'Good', color: 'text-lime-300' },
  { value: 5, icon: '😄', label: 'Great', color: 'text-emerald-300' },
];
