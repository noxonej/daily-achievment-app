import type { Quest } from '../lib/types';
import { DIFFICULTY_XP } from '../lib/xp';

type SeedQuest = Pick<
  Quest,
  'title' | 'description' | 'frequency' | 'difficulty' | 'icon' | 'category' | 'promptForNote' | 'details'
>;

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
    promptForNote: true,
  },
  {
    title: 'Meditate 10 minutes',
    description: 'Sit quietly and breathe. Clear your head.',
    frequency: 'daily',
    difficulty: 'easy',
    icon: '🧘',
    category: 'Mind',
    details:
      'Any style counts — guided app, silent breathing, a body scan, even a slow mindful walk. There is no "correct" technique here, only that you actually stopped and were present for 10 minutes.',
  },
  {
    title: 'Move your body',
    description: 'Workout, walk, stretch — 20 minutes of movement.',
    frequency: 'daily',
    difficulty: 'medium',
    icon: '🏃',
    category: 'Body',
    details:
      'This is intentionally broad: a gym session, a walk, yoga, dancing in your kitchen, a sport — anything that gets you moving for about 20 minutes. Match it to your own fitness level and what your body can actually do, not someone else\'s standard.',
  },
  {
    title: 'Drink 2L of water',
    description: 'Stay hydrated throughout the day.',
    frequency: 'daily',
    difficulty: 'easy',
    icon: '💧',
    category: 'Body',
    details:
      '2L is a common rough guideline, not a medical prescription — adjust it up or down for your body size, activity level, and climate. Other unsweetened drinks (tea, sparkling water) can reasonably count toward this if that is how you track it.',
  },
  {
    title: 'Gratitude x3',
    description: 'List three things you are grateful for today.',
    frequency: 'daily',
    difficulty: 'easy',
    icon: '🙏',
    category: 'Mind',
    promptForNote: true,
  },
  {
    title: 'No junk food',
    description: 'Skip the junk today — fuel your body well.',
    frequency: 'daily',
    difficulty: 'medium',
    icon: '🥗',
    category: 'Body',
    details:
      'Deliberately left open-ended, because "junk" means different things depending on the diet you actually follow — keto, vegan, carnivore, no restrictions at all, or something medically prescribed. Define it for yourself: usually that means skipping the things YOU consider ultra-processed, low-effort, or off-plan for how you eat, not a universal food list. If this doesn\'t map cleanly onto your diet, edit the quest or turn it off in Manage — it\'s meant to help, not to police you.',
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
    promptForNote: s.promptForNote,
    details: s.details,
  }));
}
