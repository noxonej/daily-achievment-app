import type { MeasureUnit } from './types';

export const UNIT_META: Record<MeasureUnit, { label: string; one: string; quick: number[]; decimals?: boolean }> = {
  steps: { label: 'steps', one: 'step', quick: [1000, 2500] },
  km: { label: 'km', one: 'km', quick: [1, 2.5], decimals: true },
  glasses: { label: 'glasses', one: 'glass', quick: [1] },
  reps: { label: 'reps', one: 'rep', quick: [10, 25] },
  minutes: { label: 'min', one: 'min', quick: [5, 15] },
  pages: { label: 'pages', one: 'page', quick: [5, 10] },
};
