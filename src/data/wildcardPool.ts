import type { Difficulty } from '../lib/types';

export interface WildcardSeed {
  title: string;
  description: string;
  difficulty: Difficulty;
  icon: string;
}

export const WILDCARD_POOL: WildcardSeed[] = [
  { title: 'Text an old friend', description: 'Just to say hi — no reason needed.', difficulty: 'easy', icon: '💬' },
  { title: 'Try a food you’ve never had', description: 'Something completely new to your taste buds.', difficulty: 'medium', icon: '🍜' },
  { title: 'Take a 10-minute walk, no phone', description: 'Just you and your surroundings.', difficulty: 'easy', icon: '🚶' },
  { title: 'Write down something you’re proud of', description: 'One sentence is enough.', difficulty: 'easy', icon: '🌟' },
  { title: 'Declutter one drawer or shelf', description: 'Small space, real difference.', difficulty: 'medium', icon: '🗄️' },
  { title: 'Learn 3 words in a new language', description: 'Pick a language you’ve always been curious about.', difficulty: 'easy', icon: '🗣️' },
  { title: 'Do 20 pushups', description: 'Break them up however you need to.', difficulty: 'medium', icon: '💪' },
  { title: 'Watch the sunrise or sunset', description: 'Actually stop and watch it, start to finish.', difficulty: 'easy', icon: '🌅' },
  { title: 'Cook a meal from scratch', description: 'No shortcuts, no delivery.', difficulty: 'hard', icon: '🍳' },
  { title: 'Give someone a genuine compliment', description: 'Say it out loud, mean it.', difficulty: 'easy', icon: '😊' },
  { title: 'Unplug for 2 hours', description: 'No social media, no news feeds.', difficulty: 'medium', icon: '📵' },
  { title: 'Sketch or doodle for 10 minutes', description: 'Doesn’t need to be good.', difficulty: 'easy', icon: '✏️' },
  { title: 'Write a letter you’ll never send', description: 'Say the thing you’ve been holding onto.', difficulty: 'medium', icon: '✉️' },
  { title: 'Take a cold shower', description: 'All the way through.', difficulty: 'hard', icon: '🚿' },
  { title: 'Organize your desktop or downloads folder', description: 'Delete what you don’t need.', difficulty: 'easy', icon: '🗂️' },
  { title: 'Do a 5-minute breathing exercise', description: 'Slow in, slower out.', difficulty: 'easy', icon: '🌬️' },
  { title: 'Read something outside your usual interests', description: 'A topic you’d normally skip.', difficulty: 'easy', icon: '📰' },
  { title: 'Plan a small adventure for this weekend', description: 'Doesn’t have to be big — just new.', difficulty: 'medium', icon: '🗺️' },
  { title: 'Do a random act of kindness', description: 'Pay for a coffee, leave a good review, hold the door.', difficulty: 'medium', icon: '🎁' },
  { title: 'Write your future self a note', description: 'What do you want them to remember?', difficulty: 'medium', icon: '🔮' },
  { title: 'Stretch for 10 minutes before bed', description: 'Slow and easy.', difficulty: 'easy', icon: '🤸' },
  { title: 'Cook without a recipe', description: 'Trust your instincts.', difficulty: 'hard', icon: '👨‍🍳' },
  { title: 'Explore somewhere new in your town', description: 'A street, park, or shop you’ve never been to.', difficulty: 'hard', icon: '🧭' },
  { title: 'Fix something that’s been broken for a while', description: 'The thing you keep walking past.', difficulty: 'medium', icon: '🔧' },
  { title: 'Learn how compound interest works', description: 'Five minutes, then explain it to someone.', difficulty: 'easy', icon: '📈' },
  { title: 'Leave your phone in another room for an hour', description: 'Notice how often you reach for it.', difficulty: 'medium', icon: '📵' },
  { title: 'Thank a teacher or coach', description: 'A message or a word after class.', difficulty: 'easy', icon: '🙏' },
  { title: 'Do 30 squats', description: 'Spread over the day is fine.', difficulty: 'medium', icon: '🏋' },
  { title: 'Find one thing you could sell', description: 'Old games, clothes, gadgets. Look up what it’s worth.', difficulty: 'easy', icon: '🏷' },
  { title: 'Write your dream day in 5 sentences', description: 'What would you do, where, with who?', difficulty: 'easy', icon: '✍' },
  { title: 'Make someone laugh', description: 'A joke, a meme, a funny story.', difficulty: 'easy', icon: '😄' },
  { title: 'Go to bed 30 minutes earlier', description: 'See how you feel tomorrow.', difficulty: 'medium', icon: '🌙' },
  { title: 'Clean your shoes', description: 'Small detail, big difference.', difficulty: 'easy', icon: '👟' },
  { title: 'Read one article about a job you’d love', description: 'What do they do all day? What did they learn?', difficulty: 'easy', icon: '🚀' },
];
