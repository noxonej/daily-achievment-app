import type { Difficulty, Frequency, QuestMeasure } from '../lib/types';

export interface LibraryQuest {
  title: string;
  description: string;
  frequency: Frequency;
  difficulty: Difficulty;
  icon: string;
  category: string;
  promptForNote?: boolean;
  measure?: QuestMeasure;
  noteList?: number;
}

export const QUEST_LIBRARY: LibraryQuest[] = [
  // Number goals: log progress and they complete at the target
  { title: 'Walk 10,000 steps', description: "Enter today's total from your phone's Health app.", frequency: 'daily', difficulty: 'hard', icon: '👟', category: 'Body', measure: { unit: 'steps', target: 10000 } },
  { title: 'Run 2 km', description: 'Track it with GPS or add it by hand.', frequency: 'daily', difficulty: 'hard', icon: '🏃', category: 'Body', measure: { unit: 'km', target: 2 } },
  { title: 'Do 50 push-ups', description: 'Spread them across the day if you need to.', frequency: 'daily', difficulty: 'medium', icon: '💪', category: 'Body', measure: { unit: 'reps', target: 50 } },
  { title: 'Read 20 pages', description: 'Any book counts.', frequency: 'daily', difficulty: 'medium', icon: '📖', category: 'Mind', measure: { unit: 'pages', target: 20 } },
  { title: 'Run 15 km this week', description: 'Every tracked run counts toward it.', frequency: 'weekly', difficulty: 'epic', icon: '🏃', category: 'Body', measure: { unit: 'km', target: 15 } },
  { title: '150 active minutes', description: 'The weekly amount doctors recommend.', frequency: 'weekly', difficulty: 'hard', icon: '🤸', category: 'Body', measure: { unit: 'minutes', target: 150 } },
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

  // ---- More number goals
  { title: 'Drink 2L of water', description: 'Pick your glass or bottle size with ⚙.', frequency: 'daily', difficulty: 'easy', icon: '💧', category: 'Body', measure: { unit: 'glasses', target: 8, size: 250 } },
  { title: 'Hold a 3-minute plank', description: 'Add up all your sets today.', frequency: 'daily', difficulty: 'hard', icon: '💪', category: 'Body', measure: { unit: 'minutes', target: 3, quick: [1, 0.5] } },
  { title: 'Do 100 squats', description: 'In sets of 20 is easiest.', frequency: 'daily', difficulty: 'medium', icon: '🏋', category: 'Body', measure: { unit: 'reps', target: 100, quick: [20, 10] } },
  { title: 'Do 30 sit-ups', description: 'Slow and controlled beats fast.', frequency: 'daily', difficulty: 'easy', icon: '🤸', category: 'Body', measure: { unit: 'reps', target: 30, quick: [10, 5] } },
  { title: 'Deep work: 60 minutes', description: 'Phone in another room, one task.', frequency: 'daily', difficulty: 'hard', icon: '⏳', category: 'Mind', measure: { unit: 'minutes', target: 60, quick: [25, 15] } },
  { title: 'Meditate 15 minutes', description: 'Sit, breathe, notice. That is all.', frequency: 'daily', difficulty: 'medium', icon: '🧘', category: 'Mind', measure: { unit: 'minutes', target: 15, quick: [5, 10] } },
  { title: 'Study 45 minutes', description: 'School, a course or a skill.', frequency: 'daily', difficulty: 'medium', icon: '🎓', category: 'Learning', measure: { unit: 'minutes', target: 45, quick: [15, 30] } },
  { title: 'Read 10 pages', description: 'A small daily habit adds up to 15+ books a year.', frequency: 'daily', difficulty: 'easy', icon: '📖', category: 'Mind', measure: { unit: 'pages', target: 10 } },
  { title: 'Walk 6,000 steps', description: 'A gentle start if 10,000 is too much.', frequency: 'daily', difficulty: 'easy', icon: '🚶', category: 'Body', measure: { unit: 'steps', target: 6000 } },
  { title: 'Read 100 pages this week', description: 'Every page you log counts.', frequency: 'weekly', difficulty: 'medium', icon: '📚', category: 'Learning', measure: { unit: 'pages', target: 100, quick: [10, 25] } },
  { title: '300 push-ups this week', description: 'About 45 a day.', frequency: 'weekly', difficulty: 'epic', icon: '💪', category: 'Body', measure: { unit: 'reps', target: 300, quick: [20, 50] } },
  { title: '5 hours of focused work this week', description: 'Use the focus timer and log the minutes.', frequency: 'weekly', difficulty: 'hard', icon: '⏱', category: 'Mind', measure: { unit: 'minutes', target: 300, quick: [25, 50] } },

  // ---- Out of your comfort zone
  { title: 'Take a cold shower', description: 'Finish with 30 seconds of cold. It gets easier.', frequency: 'daily', difficulty: 'medium', icon: '🚿', category: 'Body' },
  { title: 'Start a conversation with someone new', description: 'A classmate, a neighbour, the cashier.', frequency: 'daily', difficulty: 'hard', icon: '🗣', category: 'Social' },
  { title: 'Do the thing you are avoiding first', description: 'The hardest task, before anything fun.', frequency: 'daily', difficulty: 'hard', icon: '🔥', category: 'Mind' },
  { title: 'Ask a question in class or at work', description: 'Curious people learn faster.', frequency: 'daily', difficulty: 'medium', icon: '💬', category: 'Learning' },
  { title: 'Give a genuine compliment', description: 'Specific and honest. Watch their face.', frequency: 'daily', difficulty: 'easy', icon: '🙌', category: 'Social' },
  { title: 'Say no to something that wastes your time', description: 'Protect your hours.', frequency: 'daily', difficulty: 'medium', icon: '🛡', category: 'Mind' },
  { title: 'Try a food you have never eaten', description: 'New taste, new story.', frequency: 'weekly', difficulty: 'easy', icon: '🍜', category: 'Life' },
  { title: 'Post or share something you made', description: 'A drawing, a video, a project. Let people see it.', frequency: 'weekly', difficulty: 'hard', icon: '🚀', category: 'Creativity' },
  { title: 'Sign up for something new', description: 'A club, a class, a team, a challenge.', frequency: 'weekly', difficulty: 'hard', icon: '🎯', category: 'Social' },

  // ---- Mind & mood
  { title: 'Morning without the phone', description: 'First 30 minutes of the day, no screens.', frequency: 'daily', difficulty: 'medium', icon: '📵', category: 'Mind' },
  { title: 'Go outside for 15 minutes', description: 'Daylight resets your body clock and mood.', frequency: 'daily', difficulty: 'easy', icon: '🌤', category: 'Body' },
  { title: 'Breathing break', description: 'Breathe in 4, hold 4, out 4, hold 4. Five rounds.', frequency: 'daily', difficulty: 'easy', icon: '🌬', category: 'Mind' },
  { title: 'Write one thing you did well', description: 'Train your brain to notice wins.', frequency: 'daily', difficulty: 'easy', icon: '✍', category: 'Mind', promptForNote: true },
  { title: 'Max 1 hour of social media', description: 'Use your phone’s screen-time limit to help.', frequency: 'daily', difficulty: 'hard', icon: '📱', category: 'Mind' },
  { title: 'Plan tomorrow tonight', description: 'Open the Week Plan and check tomorrow.', frequency: 'daily', difficulty: 'easy', icon: '📅', category: 'Mind' },
  { title: 'Bed before 23:00', description: 'Sleep is the cheapest performance boost there is.', frequency: 'daily', difficulty: 'medium', icon: '🌙', category: 'Body' },

  // ---- Body & food
  { title: 'Eat breakfast', description: 'Protein in the morning keeps you full and focused.', frequency: 'daily', difficulty: 'easy', icon: '🍳', category: 'Body' },
  { title: 'No sugary drinks', description: 'Water, tea, or coffee without sugar.', frequency: 'daily', difficulty: 'medium', icon: '🥤', category: 'Body' },
  { title: 'Eat a fruit', description: 'Easy vitamins.', frequency: 'daily', difficulty: 'easy', icon: '🥗', category: 'Body' },
  { title: 'Work out 4 times this week', description: 'Gym, home, sport, it all counts.', frequency: 'weekly', difficulty: 'hard', icon: '🏋', category: 'Body' },
  { title: 'Play a sport with friends', description: 'Football, basketball, anything with a ball and people.', frequency: 'weekly', difficulty: 'medium', icon: '👟', category: 'Social' },

  // ---- Money
  { title: 'Spend nothing today', description: 'A no-spend day. Use what you already have.', frequency: 'daily', difficulty: 'hard', icon: '🐷', category: 'Finance' },
  { title: 'Stay under my daily limit', description: 'Check the Money tab before you buy.', frequency: 'daily', difficulty: 'medium', icon: '💰', category: 'Finance' },
  { title: 'Learn one money lesson', description: 'Money → Tips has a new lesson every day.', frequency: 'daily', difficulty: 'easy', icon: '💡', category: 'Finance' },
  { title: 'Sell or give away 3 things you don’t use', description: 'Less clutter, maybe some cash.', frequency: 'weekly', difficulty: 'medium', icon: '📦', category: 'Finance' },
  { title: 'Earn some money', description: 'A small job, a sale, a skill someone pays for.', frequency: 'weekly', difficulty: 'hard', icon: '💵', category: 'Finance' },
  { title: 'Cancel one subscription you don’t use', description: 'Check Money → Bills & subscriptions.', frequency: 'weekly', difficulty: 'easy', icon: '🧾', category: 'Finance' },

  // ---- Home & life
  { title: '10-minute tidy', description: 'Set a timer and clean until it rings.', frequency: 'daily', difficulty: 'easy', icon: '🧹', category: 'Life' },
  { title: 'Help at home without being asked', description: 'Dishes, trash, groceries.', frequency: 'daily', difficulty: 'easy', icon: '🏠', category: 'Life' },
  { title: 'Clean your desk', description: 'Clear space, clear head.', frequency: 'weekly', difficulty: 'easy', icon: '🗂', category: 'Life' },
  { title: 'Cook a meal yourself', description: 'A real one, from ingredients.', frequency: 'weekly', difficulty: 'medium', icon: '🍲', category: 'Life' },

  // ---- Learning & creativity
  { title: 'Watch a lesson instead of a random video', description: 'One educational video on something you want to learn.', frequency: 'daily', difficulty: 'easy', icon: '🎬', category: 'Learning' },
  { title: 'Learn 10 new words', description: 'In any language you are learning.', frequency: 'daily', difficulty: 'easy', icon: '🗣', category: 'Learning' },
  { title: 'Draw or design something', description: '15 minutes, just create.', frequency: 'daily', difficulty: 'easy', icon: '🎨', category: 'Creativity' },
  { title: 'Build a small project', description: 'Code, craft, video, music. Ship something tiny.', frequency: 'weekly', difficulty: 'hard', icon: '🔧', category: 'Creativity' },
  { title: 'Teach someone something', description: 'Explaining it is the best way to really learn it.', frequency: 'weekly', difficulty: 'medium', icon: '🎓', category: 'Learning' },

  // ---- People
  { title: 'Call a grandparent or relative', description: 'They will love it more than you think.', frequency: 'weekly', difficulty: 'easy', icon: '☎', category: 'Social' },
  { title: 'Say thank you to someone', description: 'Out loud, and mean it.', frequency: 'daily', difficulty: 'easy', icon: '🙏', category: 'Social' },
  { title: 'Do a kind thing for a stranger', description: 'Hold a door, help carry, pay a compliment.', frequency: 'weekly', difficulty: 'easy', icon: '🤝', category: 'Social' },
];
