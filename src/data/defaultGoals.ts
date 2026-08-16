import type { LongTermGoal } from '../lib/types';

type SeedGoal = Pick<LongTermGoal, 'title' | 'description' | 'timeframe' | 'target' | 'unit' | 'icon'>;

const seeds: SeedGoal[] = [
  {
    title: 'Read 12 books',
    description: 'Finish a book a month, give or take.',
    timeframe: 'yearly',
    target: 12,
    unit: 'books',
    icon: '📚',
  },
  {
    title: 'Meditate 100 days',
    description: 'Build a real meditation habit this year.',
    timeframe: 'yearly',
    target: 100,
    unit: 'days',
    icon: '🧘',
  },
  {
    title: 'Learn a new skill',
    description: 'Track your practice sessions toward mastering something new.',
    timeframe: 'yearly',
    target: 50,
    unit: 'sessions',
    icon: '🎯',
  },
];

export function buildDefaultGoals(): LongTermGoal[] {
  const now = new Date().toISOString();
  return seeds.map((s, i) => ({
    id: `default-goal-${i}`,
    title: s.title,
    description: s.description,
    timeframe: s.timeframe,
    target: s.target,
    unit: s.unit,
    progress: 0,
    icon: s.icon,
    createdAt: now,
  }));
}
