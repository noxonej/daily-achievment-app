import type { Difficulty, Frequency } from '../lib/types';

export interface LibraryQuest {
  title: string;
  description: string;
  frequency: Frequency;
  difficulty: Difficulty;
  icon: string;
  category: string;
  promptForNote?: boolean;
}

export const QUEST_LIBRARY: LibraryQuest[] = [
  // Daily — Mind
  { title: 'Digital sunset', description: 'No screens for the hour before bed.', frequency: 'daily', difficulty: 'medium', icon: '🌙', category: 'Mind' },
  { title: 'Read the news for 10 minutes', description: 'Stay informed, then stop.', frequency: 'daily', difficulty: 'easy', icon: '📰', category: 'Mind' },
  { title: 'Practice a skill deliberately', description: '15 focused minutes on something you want to get better at.', frequency: 'daily', difficulty: 'medium', icon: '🎯', category: 'Mind' },
  { title: 'Write down tomorrow’s top 3', description: 'Three things that matter most, before you sleep.', frequency: 'daily', difficulty: 'easy', icon: '🗓️', category: 'Mind', promptForNote: true },

  // Daily — Body
  { title: 'Stretch 10 minutes', description: 'Loosen up, morning or night.', frequency: 'daily', difficulty: 'easy', icon: '🤸', category: 'Body' },
  { title: 'Take the stairs', description: 'Skip the elevator today.', frequency: 'daily', difficulty: 'easy', icon: '🪜', category: 'Body' },
  { title: 'Eat a vegetable with every meal', description: 'Something green or colorful, every time.', frequency: 'daily', difficulty: 'medium', icon: '🥦', category: 'Body' },
  { title: 'Get 7+ hours of sleep', description: 'Track it, protect it.', frequency: 'daily', difficulty: 'medium', icon: '😴', category: 'Body' },

  // Daily — Life
  { title: 'Make your bed', description: 'A small win before the day even starts.', frequency: 'daily', difficulty: 'easy', icon: '🛏️', category: 'Life' },
  { title: 'Inbox to zero', description: 'Clear it out, archive or act on everything.', frequency: 'daily', difficulty: 'medium', icon: '📧', category: 'Life' },
  { title: 'No impulse purchases', description: 'If it’s not planned, it waits 24 hours.', frequency: 'daily', difficulty: 'medium', icon: '🛍️', category: 'Finance' },
  { title: 'Track today’s spending', description: 'Write down everything you spent.', frequency: 'daily', difficulty: 'easy', icon: '💵', category: 'Finance' },

  // Daily — Learning & Creativity
  { title: 'Practice a language, 10 minutes', description: 'Duolingo, flashcards, whatever sticks.', frequency: 'daily', difficulty: 'medium', icon: '🗣️', category: 'Learning' },
  { title: 'Learn something new', description: 'A fact, a word, a concept — anything.', frequency: 'daily', difficulty: 'easy', icon: '💡', category: 'Learning' },
  { title: 'Write 200 words', description: 'Journal, fiction, blog — just write.', frequency: 'daily', difficulty: 'medium', icon: '✍️', category: 'Creativity' },
  { title: 'Practice an instrument', description: '15 minutes, no pressure to be good yet.', frequency: 'daily', difficulty: 'medium', icon: '🎸', category: 'Creativity' },

  // Daily — Social
  { title: 'Message someone you care about', description: 'Just check in.', frequency: 'daily', difficulty: 'easy', icon: '💌', category: 'Social' },
  { title: 'Have one real conversation', description: 'Phone away, actually present.', frequency: 'daily', difficulty: 'easy', icon: '🗨️', category: 'Social' },

  // Weekly — Finance
  { title: 'Review your budget', description: 'Where did the money actually go this week?', frequency: 'weekly', difficulty: 'medium', icon: '📊', category: 'Finance' },
  { title: 'Move money to savings', description: 'Even a small amount, every week.', frequency: 'weekly', difficulty: 'medium', icon: '🏦', category: 'Finance' },

  // Weekly — Learning & Creativity
  { title: 'Finish one course lesson', description: 'Whatever you’re taking — keep it moving.', frequency: 'weekly', difficulty: 'medium', icon: '🎓', category: 'Learning' },
  { title: 'Read one long-form article', description: 'Something with real depth, start to finish.', frequency: 'weekly', difficulty: 'easy', icon: '📄', category: 'Learning' },
  { title: 'Finish a creative piece', description: 'A drawing, a song, a chapter — something completed.', frequency: 'weekly', difficulty: 'hard', icon: '🖌️', category: 'Creativity' },

  // Weekly — Social
  { title: 'Share a proper meal with someone', description: 'Sit down together, no phones.', frequency: 'weekly', difficulty: 'easy', icon: '🍽️', category: 'Social' },
  { title: 'Plan a hangout', description: 'Actually put something on the calendar.', frequency: 'weekly', difficulty: 'medium', icon: '🎉', category: 'Social' },

  // Weekly — Body
  { title: 'Try a new workout', description: 'Something you haven’t done before.', frequency: 'weekly', difficulty: 'medium', icon: '🏋️', category: 'Body' },
  { title: 'Meal prep for the week', description: 'Set future-you up to eat well.', frequency: 'weekly', difficulty: 'medium', icon: '🍱', category: 'Body' },

  // Weekly — Life & Mind
  { title: 'Do all the laundry', description: 'Washed, dried, and put away.', frequency: 'weekly', difficulty: 'easy', icon: '🧺', category: 'Life' },
  { title: 'Handle the errand you keep avoiding', description: 'The one that’s been on the list too long.', frequency: 'weekly', difficulty: 'medium', icon: '🚗', category: 'Life' },
  { title: 'Have a full digital detox day', description: 'One entire day, offline.', frequency: 'weekly', difficulty: 'hard', icon: '📴', category: 'Mind' },
  { title: 'Weekly retrospective', description: 'What went well, what didn’t, what’s next.', frequency: 'weekly', difficulty: 'medium', icon: '📔', category: 'Mind', promptForNote: true },
];
