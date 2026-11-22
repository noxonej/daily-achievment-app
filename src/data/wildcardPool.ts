import type { Difficulty } from '../lib/types';

type Stat = 'body' | 'mind' | 'wealth' | 'discipline' | 'social';

export interface WildcardSeed {
  title: string;
  description: string;
  difficulty: Difficulty;
  icon: string;
  /** IRL stats it grows. Defaults to the theme's stats. */
  stats?: Stat[];
}

/**
 * Daily bonus quests (2026-11-22): every weekday has its own theme, so each day of the week feels
 * different, and each theme has a big pool so the same quest rarely comes back. You get three
 * options a day and can pick the one you like (see lib/wildcard.ts).
 */
export interface WildcardTheme {
  id: 'money' | 'body' | 'mind' | 'social' | 'hustle' | 'explore' | 'reset';
  /** Short name shown on the card, e.g. "Money Monday". */
  name: string;
  lt: string;
  icon: string;
  /** Tailwind text colour for the theme chip. */
  tone: string;
  stats: Stat[];
  pool: WildcardSeed[];
}

const MONEY: WildcardSeed[] = [
  { title: 'Have a no-spend day', description: 'Buy nothing today except what you truly need, like a bus ticket.', difficulty: 'medium', icon: '🚫' },
  { title: 'Write down every euro you spend today', description: 'Every snack, every app, every ticket. Look at the list tonight.', difficulty: 'easy', icon: '🧾' },
  { title: 'Put 5 € (or any amount) into savings', description: 'Small is fine. The habit matters more than the amount.', difficulty: 'easy', icon: '🐷' },
  { title: 'Find one subscription you don’t use', description: 'Check your phone’s subscriptions list. Cancel or write it down.', difficulty: 'easy', icon: '💳' },
  { title: 'Make your own lunch or snack', description: 'Instead of buying it. Work out how much you saved.', difficulty: 'easy', icon: '🍱' },
  { title: 'Use the 24-hour rule', description: 'Want to buy something today? Wait 24 hours, then decide.', difficulty: 'easy', icon: '⏳' },
  { title: 'Learn what compound interest is', description: 'Five minutes. Then explain it to someone in one sentence.', difficulty: 'easy', icon: '📈', stats: ['wealth', 'mind'] },
  { title: 'Count all the money you have', description: 'Cash, card, savings. Know your real number.', difficulty: 'easy', icon: '🧮' },
  { title: 'Set a savings goal with a date', description: 'What for, how much, by when. Add it in the Money tab.', difficulty: 'medium', icon: '🎯' },
  { title: 'Compare prices before one buy', description: 'Check two other shops or sites before you pay.', difficulty: 'easy', icon: '🔍' },
  { title: 'Sell one thing you no longer use', description: 'Old games, clothes, gadgets. List it online today.', difficulty: 'medium', icon: '🏷' },
  { title: 'Walk or bike instead of paying for a ride', description: 'Save the ticket money and get steps for free.', difficulty: 'easy', icon: '🚲', stats: ['wealth', 'body'] },
  { title: 'Read about one way people invest', description: 'Index funds, bonds or savings accounts. Learn how one works.', difficulty: 'easy', icon: '🏦', stats: ['wealth', 'mind'] },
  { title: 'Drink only water outside the house', description: 'No bought drinks today. Bring a bottle.', difficulty: 'medium', icon: '💧', stats: ['wealth', 'body'] },
  { title: 'Plan this week’s spending', description: 'Write how much you can spend each day and stick to it.', difficulty: 'medium', icon: '📋' },
  { title: 'Find out what an hour of your time is worth', description: 'Pocket money or pay divided by hours. Now look at prices again.', difficulty: 'easy', icon: '⏱' },
  { title: 'Unfollow 3 accounts that make you want to buy stuff', description: 'Less ads in your feed, more money in your pocket.', difficulty: 'easy', icon: '📵' },
  { title: 'Ask someone how they save money', description: 'A parent, a friend, a teacher. Write down their best trick.', difficulty: 'easy', icon: '💬', stats: ['wealth', 'social'] },
  { title: 'Fix something instead of buying new', description: 'A loose button, a squeaky door, a broken cable.', difficulty: 'medium', icon: '🔧' },
  { title: 'Round up and save the change', description: 'Every buy today: round it up and save the difference.', difficulty: 'easy', icon: '🪙' },
  { title: 'Cook a meal for under 3 € a portion', description: 'Cheap, healthy and yours. Rice, eggs, beans and veg work.', difficulty: 'hard', icon: '🍲', stats: ['wealth', 'body'] },
  { title: 'Write down your 3 biggest money wishes', description: 'What would you save up for? Order them by how much they matter.', difficulty: 'easy', icon: '✍' },
  { title: 'Check what’s in your fridge before shopping', description: 'Use what you have first. No food goes in the bin.', difficulty: 'easy', icon: '🥗' },
];

const BODY: WildcardSeed[] = [
  { title: 'Do 20 push-ups', description: 'Break them up however you need to.', difficulty: 'medium', icon: '💪' },
  { title: 'Do 30 squats', description: 'Spread over the day is fine.', difficulty: 'medium', icon: '🏋' },
  { title: 'Hold a plank for 1 minute in total', description: 'Three times 20 seconds counts.', difficulty: 'medium', icon: '⏱' },
  { title: 'Take a 10-minute walk, no phone', description: 'Just you and your surroundings.', difficulty: 'easy', icon: '🚶' },
  { title: 'Stretch for 10 minutes before bed', description: 'Slow and easy. Hips, back, shoulders.', difficulty: 'easy', icon: '🤸' },
  { title: 'Take a cold shower', description: 'Even the last 30 seconds cold counts.', difficulty: 'hard', icon: '🚿', stats: ['body', 'discipline'] },
  { title: 'Eat 3 different vegetables today', description: 'Colours count: green, red, orange.', difficulty: 'medium', icon: '🥦' },
  { title: 'Go to bed 30 minutes earlier', description: 'See how you feel tomorrow.', difficulty: 'medium', icon: '🌙' },
  { title: 'Take the stairs all day', description: 'No lifts, no escalators.', difficulty: 'easy', icon: '🪜' },
  { title: 'Do 50 jumping jacks', description: 'Wake your whole body up.', difficulty: 'easy', icon: '⚡' },
  { title: 'Drink a glass of water after you wake up', description: 'Before coffee, before your phone.', difficulty: 'easy', icon: '💧' },
  { title: 'Run or jog for 15 minutes', description: 'Slow is fine. Just keep moving.', difficulty: 'hard', icon: '🏃' },
  { title: 'Eat no sugar after 6 pm', description: 'Fruit is fine. Sweets wait for tomorrow.', difficulty: 'medium', icon: '🍿' },
  { title: 'Sit up straight for one whole lesson or hour', description: 'Shoulders back, feet flat.', difficulty: 'easy', icon: '🧍' },
  { title: 'Learn one new exercise', description: 'Watch how to do it right, then do 10.', difficulty: 'easy', icon: '🎓', stats: ['body', 'mind'] },
  { title: 'Play a sport for 20 minutes', description: 'Football, basketball, anything with a ball.', difficulty: 'medium', icon: '⚽', stats: ['body', 'social'] },
  { title: 'Eat a proper breakfast', description: 'Protein and something fresh. Not just a snack.', difficulty: 'easy', icon: '🍳' },
  { title: 'Do 3 minutes of slow breathing', description: 'In for 4, hold 4, out for 6.', difficulty: 'easy', icon: '🌬' },
  { title: 'Walk 2,000 extra steps', description: 'Take the long way, walk while you call.', difficulty: 'medium', icon: '👟' },
  { title: 'No screens for 30 minutes before sleep', description: 'Read, stretch or plan tomorrow instead.', difficulty: 'medium', icon: '😴', stats: ['body', 'discipline'] },
  { title: 'Dance to 3 songs', description: 'Nobody needs to watch. Just move.', difficulty: 'easy', icon: '🎵' },
  { title: 'Do 10 pull-ups or 20 rows', description: 'A bar, a table or a backpack. Split them up.', difficulty: 'hard', icon: '🏋' },
];

const MIND: WildcardSeed[] = [
  { title: 'Learn 5 words in a new language', description: 'Pick a language you’ve always been curious about.', difficulty: 'easy', icon: '🗣' },
  { title: 'Read something outside your usual interests', description: 'A topic you’d normally skip.', difficulty: 'easy', icon: '📰' },
  { title: 'Watch one video that teaches you a skill', description: 'Then try it yourself once.', difficulty: 'easy', icon: '🎓' },
  { title: 'Write down something you’re proud of', description: 'One sentence is enough.', difficulty: 'easy', icon: '🌟' },
  { title: 'Do a puzzle or brain game for 10 minutes', description: 'Sudoku, chess, a crossword.', difficulty: 'easy', icon: '🧩' },
  { title: 'Write your dream day in 5 sentences', description: 'What would you do, where, with who?', difficulty: 'easy', icon: '✍' },
  { title: 'Listen to a podcast episode about something new', description: 'Science, history, money, sport. Anything new.', difficulty: 'easy', icon: '🎧' },
  { title: 'Study 25 minutes with no phone', description: 'Phone in another room. Use the Focus timer.', difficulty: 'medium', icon: '⏱', stats: ['mind', 'discipline'] },
  { title: 'Teach someone one thing you know', description: 'Explaining it makes you understand it better.', difficulty: 'medium', icon: '💡', stats: ['mind', 'social'] },
  { title: 'Write a letter to your future self', description: 'What do you want them to remember?', difficulty: 'medium', icon: '🔮' },
  { title: 'Read 10 pages of a non-fiction book', description: 'Biography, science, business. Real stories.', difficulty: 'medium', icon: '📖' },
  { title: 'Sit in silence for 5 minutes', description: 'No music, no phone. Notice your thoughts.', difficulty: 'easy', icon: '🧘' },
  { title: 'Write down 3 things that went well today', description: 'And why they went well.', difficulty: 'easy', icon: '📝' },
  { title: 'Look up a word you didn’t know', description: 'Use it twice today.', difficulty: 'easy', icon: '🔤' },
  { title: 'Draw or doodle for 10 minutes', description: 'Doesn’t need to be good.', difficulty: 'easy', icon: '✏' },
  { title: 'Learn how something around you works', description: 'A fridge, a phone screen, a bridge. Look it up.', difficulty: 'easy', icon: '⚙' },
  { title: 'Plan tomorrow tonight', description: 'Your top 3 things, written before bed.', difficulty: 'easy', icon: '🗓', stats: ['mind', 'discipline'] },
  { title: 'Write down one worry, then one step to fix it', description: 'Small steps make big worries smaller.', difficulty: 'medium', icon: '📓' },
  { title: 'Read about a person you look up to', description: 'How did they start? What did they do at your age?', difficulty: 'easy', icon: '🚀' },
  { title: 'Leave your phone in another room for an hour', description: 'Notice how often you reach for it.', difficulty: 'medium', icon: '📵', stats: ['mind', 'discipline'] },
  { title: 'Memorise a short poem or quote', description: 'Say it out loud without looking.', difficulty: 'medium', icon: '❝' },
  { title: 'Practise an instrument or a song for 15 minutes', description: 'Or start learning one.', difficulty: 'medium', icon: '🎸' },
];

const SOCIAL: WildcardSeed[] = [
  { title: 'Text an old friend', description: 'Just to say hi. No reason needed.', difficulty: 'easy', icon: '💬' },
  { title: 'Give someone a real compliment', description: 'Say it out loud and mean it.', difficulty: 'easy', icon: '😊' },
  { title: 'Make someone laugh', description: 'A joke, a meme, a funny story.', difficulty: 'easy', icon: '😄' },
  { title: 'Thank a teacher or coach', description: 'A message or a word after class.', difficulty: 'easy', icon: '🙏' },
  { title: 'Do a random act of kindness', description: 'Hold a door, help carry something, leave a nice review.', difficulty: 'medium', icon: '🎁' },
  { title: 'Call a grandparent or relative', description: 'Ask them about when they were your age.', difficulty: 'medium', icon: '☎' },
  { title: 'Start a talk with someone new', description: 'A classmate, a neighbour, someone at training.', difficulty: 'hard', icon: '👋', stats: ['social', 'discipline'] },
  { title: 'Help at home without being asked', description: 'Dishes, bins, laundry. Just do it.', difficulty: 'easy', icon: '🧽' },
  { title: 'Ask a friend how they really are', description: 'And listen to the whole answer.', difficulty: 'easy', icon: '👂' },
  { title: 'Eat a meal with no phones at the table', description: 'Talk to the people you eat with.', difficulty: 'medium', icon: '🍽' },
  { title: 'Send a voice message instead of a text', description: 'Hearing your voice means more.', difficulty: 'easy', icon: '🎤' },
  { title: 'Invite someone to do something this week', description: 'A walk, a game, a gym session.', difficulty: 'medium', icon: '📮' },
  { title: 'Say sorry for something small', description: 'Clear it up. It feels lighter after.', difficulty: 'hard', icon: '🤝' },
  { title: 'Cheer a friend in Squzo', description: 'Open Friends and send a cheer.', difficulty: 'easy', icon: '👏' },
  { title: 'Look people in the eye when you talk', description: 'All day. Notice how they react.', difficulty: 'medium', icon: '👥', stats: ['social', 'mind'] },
  { title: 'Ask someone for advice', description: 'People like to help. Ask a real question.', difficulty: 'easy', icon: '🙋' },
  { title: 'Share something useful you learned', description: 'With a friend or family, not online.', difficulty: 'easy', icon: '💡' },
  { title: 'Remember a name and use it', description: 'Someone you met recently. Say hi by name.', difficulty: 'easy', icon: '🗨' },
  { title: 'Write a thank-you note', description: 'Paper or message. Be specific about why.', difficulty: 'easy', icon: '💌' },
  { title: 'Play a game with family', description: 'Board game, cards, a video game together.', difficulty: 'easy', icon: '🎲' },
  { title: 'Speak up once in class or a group', description: 'One question or one idea. That’s it.', difficulty: 'medium', icon: '🗣', stats: ['social', 'discipline'] },
];

const HUSTLE: WildcardSeed[] = [
  { title: 'Write down 3 ways you could earn money', description: 'Dog walking, tutoring, selling art, helping neighbours.', difficulty: 'easy', icon: '💡' },
  { title: 'Practise a skill people pay for, 30 minutes', description: 'Design, coding, video editing, a language.', difficulty: 'medium', icon: '💻', stats: ['wealth', 'mind'] },
  { title: 'Read one article about a job you’d love', description: 'What do they do all day? What did they learn?', difficulty: 'easy', icon: '🚀', stats: ['wealth', 'mind'] },
  { title: 'Offer a neighbour help for a small fee', description: 'Washing a car, raking leaves, carrying shopping.', difficulty: 'hard', icon: '🤝', stats: ['wealth', 'social'] },
  { title: 'Make one thing you could sell', description: 'A drawing, a bracelet, a cake, a sticker design.', difficulty: 'medium', icon: '🎨' },
  { title: 'Watch how a small business started', description: 'Look up the story of a brand you like.', difficulty: 'easy', icon: '🏢' },
  { title: 'Make a simple list of your skills', description: 'Everything you’re good at, even small things.', difficulty: 'easy', icon: '📋' },
  { title: 'Learn one keyboard shortcut or app trick', description: 'Small speed-ups save hours over a year.', difficulty: 'easy', icon: '⌚' },
  { title: 'Take a 1-hour deep work block', description: 'One task, no phone, no breaks.', difficulty: 'hard', icon: '⏱', stats: ['wealth', 'discipline'] },
  { title: 'Look up how much a skill you like pays', description: 'Freelance rates or a job salary. Write it down.', difficulty: 'easy', icon: '📊' },
  { title: 'Ask an adult how they got their first job', description: 'Write down one thing that surprised you.', difficulty: 'easy', icon: '💬', stats: ['wealth', 'social'] },
  { title: 'Start a portfolio page or folder', description: 'Put your best work in one place.', difficulty: 'medium', icon: '🗂' },
  { title: 'Finish one task you’ve been putting off', description: 'Do it first, before anything fun.', difficulty: 'medium', icon: '✅', stats: ['discipline'] },
  { title: 'Learn the basics of a new tool', description: 'A spreadsheet, a photo editor, a code editor.', difficulty: 'medium', icon: '🔧', stats: ['wealth', 'mind'] },
  { title: 'Write a 3-line pitch for a business idea', description: 'What it is, who it’s for, why they’d pay.', difficulty: 'medium', icon: '✍' },
  { title: 'Wake up 30 minutes early and use them', description: 'For a skill, a plan or a workout.', difficulty: 'hard', icon: '⏰', stats: ['discipline', 'wealth'] },
  { title: 'Ship something small today', description: 'Post your art, publish your code, show your work.', difficulty: 'hard', icon: '🚀' },
  { title: 'Find a free course and start lesson 1', description: 'Coding, design, marketing. Free is everywhere.', difficulty: 'medium', icon: '🎓', stats: ['wealth', 'mind'] },
  { title: 'Set one goal for this month’s income', description: 'Even 20 €. Write how you’ll get there.', difficulty: 'easy', icon: '🎯' },
  { title: 'Help someone with their project for free', description: 'Experience now, paid work later.', difficulty: 'medium', icon: '🙌', stats: ['wealth', 'social'] },
];

const EXPLORE: WildcardSeed[] = [
  { title: 'Try a food you’ve never had', description: 'Something completely new to your taste buds.', difficulty: 'medium', icon: '🍜' },
  { title: 'Explore somewhere new in your town', description: 'A street, park or shop you’ve never been to.', difficulty: 'hard', icon: '🧭' },
  { title: 'Watch the sunrise or sunset', description: 'Actually stop and watch it, start to finish.', difficulty: 'easy', icon: '🌅' },
  { title: 'Cook a meal from scratch', description: 'No shortcuts, no delivery.', difficulty: 'hard', icon: '🍳', stats: ['body', 'discipline'] },
  { title: 'Take 5 photos of beautiful small things', description: 'A leaf, a shadow, a cool sign.', difficulty: 'easy', icon: '📷' },
  { title: 'Spend an hour outside', description: 'Forest, park, beach, anywhere green.', difficulty: 'medium', icon: '🥾', stats: ['body'] },
  { title: 'Try a new sport or game', description: 'Something you’ve never played.', difficulty: 'medium', icon: '🎲', stats: ['body', 'social'] },
  { title: 'Listen to a music genre you never play', description: 'Jazz, classical, something from another country.', difficulty: 'easy', icon: '🎧' },
  { title: 'Plan a small adventure for next weekend', description: 'Doesn’t have to be big, just new.', difficulty: 'easy', icon: '🗺' },
  { title: 'Bake something', description: 'Cookies, bread, a cake. Share it.', difficulty: 'medium', icon: '🎂', stats: ['mind', 'social'] },
  { title: 'Go somewhere without GPS', description: 'Find the way yourself.', difficulty: 'medium', icon: '🧭', stats: ['mind'] },
  { title: 'Make a short video about your day', description: '30 seconds. Just for you.', difficulty: 'easy', icon: '🎥' },
  { title: 'Unplug for 2 hours', description: 'No social media, no feeds.', difficulty: 'medium', icon: '📴', stats: ['mind', 'discipline'] },
  { title: 'Visit a library or museum', description: 'Many are free. Find one thing that surprises you.', difficulty: 'medium', icon: '📚', stats: ['mind'] },
  { title: 'Climb something', description: 'A hill, a climbing wall, a tower’s stairs.', difficulty: 'hard', icon: '🧗', stats: ['body'] },
  { title: 'Learn a card trick or magic trick', description: 'Show it to someone tonight.', difficulty: 'medium', icon: '🪄', stats: ['mind', 'social'] },
  { title: 'Write a short story in 10 minutes', description: 'Start with: "Nobody expected the door to open…"', difficulty: 'medium', icon: '✍', stats: ['mind'] },
  { title: 'Ride a bike somewhere new', description: 'A new route, a new place.', difficulty: 'medium', icon: '🚲', stats: ['body'] },
  { title: 'Go stargazing for 10 minutes', description: 'Find one constellation.', difficulty: 'easy', icon: '🌠', stats: ['mind'] },
  { title: 'Say yes to something new today', description: 'An invite, a food, an idea.', difficulty: 'medium', icon: '🎈', stats: ['social'] },
];

const RESET: WildcardSeed[] = [
  { title: 'Declutter one drawer or shelf', description: 'Small space, real difference.', difficulty: 'medium', icon: '🗄' },
  { title: 'Plan your week in 10 minutes', description: 'Tests, training, plans. Use the Plan tab.', difficulty: 'easy', icon: '📅' },
  { title: 'Clean your shoes', description: 'Small detail, big difference.', difficulty: 'easy', icon: '👟' },
  { title: 'Clear your phone’s photos and downloads', description: 'Delete what you don’t need.', difficulty: 'easy', icon: '🗂' },
  { title: 'Change your bed sheets', description: 'Fresh sheets, better sleep.', difficulty: 'easy', icon: '🛏' },
  { title: 'Check your money for the week', description: 'What came in, what went out. One look is enough.', difficulty: 'easy', icon: '💰', stats: ['wealth'] },
  { title: 'Pack your bag for tomorrow tonight', description: 'No rushing in the morning.', difficulty: 'easy', icon: '🎒' },
  { title: 'Fix something that’s been broken a while', description: 'The thing you keep walking past.', difficulty: 'medium', icon: '🔧' },
  { title: 'Give away or sell 3 things', description: 'Clothes you don’t wear, games you don’t play.', difficulty: 'medium', icon: '📦', stats: ['wealth'] },
  { title: 'Wash and fold your laundry', description: 'All of it, put away.', difficulty: 'medium', icon: '🧺' },
  { title: 'Look back at your week', description: 'Best moment, hardest moment, one lesson.', difficulty: 'easy', icon: '📓', stats: ['mind'] },
  { title: 'Set one goal for next week', description: 'One, clear, written down.', difficulty: 'easy', icon: '🎯' },
  { title: 'Clean your desk completely', description: 'Only what you need stays on it.', difficulty: 'easy', icon: '🧹' },
  { title: 'Delete 3 apps you don’t need', description: 'Less noise on your phone.', difficulty: 'easy', icon: '🗑', stats: ['mind'] },
  { title: 'Prepare food for tomorrow', description: 'A lunch box, cut fruit, a bottle of water.', difficulty: 'easy', icon: '🍱', stats: ['body', 'wealth'] },
  { title: 'Unsubscribe from 5 emails', description: 'Shop newsletters go first.', difficulty: 'easy', icon: '📧', stats: ['wealth'] },
  { title: 'Take a slow evening', description: 'Bath or shower, tea, early night.', difficulty: 'easy', icon: '☕', stats: ['body', 'mind'] },
  { title: 'Clean out your bag or backpack', description: 'Old papers, wrappers, lost coins.', difficulty: 'easy', icon: '🎒' },
  { title: 'Air out your room for 10 minutes', description: 'Window wide open. Fresh air, clear head.', difficulty: 'easy', icon: '🌬', stats: ['body'] },
  { title: 'Write your top 3 wins of the week', description: 'Big or small, they count.', difficulty: 'easy', icon: '🏆', stats: ['mind'] },
];

/** Monday first (index 0) to Sunday (index 6). */
export const WILDCARD_THEMES: WildcardTheme[] = [
  { id: 'money', name: 'Money Monday', lt: 'Pinigų pirmadienis', icon: '💰', tone: 'text-emerald-300', stats: ['wealth'], pool: MONEY },
  { id: 'body', name: 'Training Tuesday', lt: 'Treniruočių antradienis', icon: '💪', tone: 'text-rose-300', stats: ['body'], pool: BODY },
  { id: 'mind', name: 'Wise Wednesday', lt: 'Išminties trečiadienis', icon: '🧠', tone: 'text-violet-300', stats: ['mind'], pool: MIND },
  { id: 'social', name: 'Team Thursday', lt: 'Draugų ketvirtadienis', icon: '🤝', tone: 'text-sky-300', stats: ['social'], pool: SOCIAL },
  { id: 'hustle', name: 'Hustle Friday', lt: 'Uždarbio penktadienis', icon: '🚀', tone: 'text-amber-300', stats: ['wealth', 'discipline'], pool: HUSTLE },
  { id: 'explore', name: 'Adventure Saturday', lt: 'Nuotykių šeštadienis', icon: '🧭', tone: 'text-orange-300', stats: ['mind', 'body'], pool: EXPLORE },
  { id: 'reset', name: 'Reset Sunday', lt: 'Atsinaujinimo sekmadienis', icon: '🔄', tone: 'text-teal-300', stats: ['discipline'], pool: RESET },
];

/** Every daily bonus quest (all themes). */
export const WILDCARD_POOL: WildcardSeed[] = WILDCARD_THEMES.flatMap((t) => t.pool);
