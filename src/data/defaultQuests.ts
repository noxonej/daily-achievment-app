import type { Quest } from '../lib/types';
import { DIFFICULTY_XP } from '../lib/xp';

type SeedQuest = Pick<Quest, 'title' | 'description' | 'frequency' | 'difficulty' | 'icon' | 'category'>;

const seeds: SeedQuest[] = [
  // Daily quests
  {
    title: 'Read 15 pages',
    description: 'Open a book and get lost in it for a while.',
    frequency: 'daily',
    difficulty: 'medium',
    icon: '📖',
    category: 'Mind',
  },
  {
    title: 'Journal',
    description: 'Write a few lines about your day, thoughts, or plans.',
    frequency: 'daily',
    difficulty: 'easy',
    icon: '📝',
    category: 'Mind',
  },
  {
    title: 'Meditate 10 minutes',
    description: 'Sit quietly and breathe. Clear your head.',
    frequency: 'daily',
    difficulty: 'easy',
    icon: '🧘',
    category: 'Mind',
  },
  {
    title: 'Move your body',
    description: 'Workout, walk, stretch — 20 minutes of movement.',
    frequency: 'daily',
    difficulty: 'medium',
    icon: '🏃',
    category: 'Body',
  },
  {
    title: 'Drink 2L of water',
    description: 'Stay hydrated throughout the day.',
    frequency: 'daily',
    difficulty: 'easy',
    icon: '💧',
    category: 'Body',
  },
  {
    title: 'Gratitude x3',
    description: 'List three things you are grateful for today.',
    frequency: 'daily',
    difficulty: 'easy',
    icon: '🙏',
    category: 'Mind',
  },
  {
    title: 'No junk food',
    description: 'Skip the junk today — fuel your body well.',
    frequency: 'daily',
    difficulty: 'medium',
    icon: '🥗',
    category: 'Body',
  },
  {
    title: 'Tidy your space',
    description: 'Spend 10 minutes tidying your room or desk.',
    frequency: 'daily',
    difficulty: 'easy',
    icon: '🧹',
    category: 'Life',
  },

  // Weekly quests — bigger, need more time to accomplish
  {
    title: 'Finish a book chapter set',
    description: 'Make real progress on a book — several chapters deep.',
    frequency: 'weekly',
    difficulty: 'hard',
    icon: '📚',
    category: 'Mind',
  },
  {
    title: 'Deep clean your space',
    description: 'A proper clean, not just tidying — floors, surfaces, all of it.',
    frequency: 'weekly',
    difficulty: 'medium',
    icon: '🧽',
    category: 'Life',
  },
  {
    title: 'Connect with someone',
    description: 'Call or meet a friend or family member you care about.',
    frequency: 'weekly',
    difficulty: 'easy',
    icon: '☎️',
    category: 'Social',
  },
  {
    title: 'Plan next week',
    description: 'Review how this week went and set your goals for the next.',
    frequency: 'weekly',
    difficulty: 'medium',
    icon: '🗓️',
    category: 'Life',
  },
  {
    title: 'Workout 3 times',
    description: 'Get three real workouts done this week.',
    frequency: 'weekly',
    difficulty: 'hard',
    icon: '💪',
    category: 'Body',
  },
  {
    title: 'Step outside your comfort zone',
    description: 'Do something new or scary — big or small.',
    frequency: 'weekly',
    difficulty: 'epic',
    icon: '🚀',
    category: 'Mind',
  },
];

export function buildDefaultQuests(): Quest[] {
  const now = new Date().toISOString();
  return seeds.map((s, i) => ({
    id: `default-${i}`,
    title: s.title,
    description: s.description,
    frequency: s.frequency,
    difficulty: s.difficulty,
    xp: DIFFICULTY_XP[s.difficulty],
    icon: s.icon,
    category: s.category,
    custom: false,
    archived: false,
    createdAt: now,
  }));
}
