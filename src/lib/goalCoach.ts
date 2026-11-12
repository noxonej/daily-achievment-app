import type { GoalLogEntry, LongTermGoal } from './types';

/**
 * Goal journal and tips for long-term goals.
 *
 * Some goals are better with a log: name every book you read, every sport session, every
 * meditation. The app looks at what you logged (your favourite genre, your main sport, which
 * meditations you tried) and picks a tip that fits. It runs on the phone with a built-in list,
 * so it works offline and costs nothing.
 */
export type GoalKind = 'books' | 'sport' | 'meditation' | 'skill' | 'art';

export function goalKind(g: Pick<LongTermGoal, 'title' | 'unit' | 'kind'>): GoalKind | null {
  if (g.kind) return g.kind;
  const t = `${g.title} ${g.unit}`.toLowerCase();
  if (/\bbooks?\b|\bread/.test(t)) return 'books';
  if (/meditat/.test(t)) return 'meditation';
  if (/draw|paint|music|guitar|piano|\bsing|photo|\bart\b|animation|design/.test(t)) return 'art';
  if (/skill|course|lesson|code|coding|side project/.test(t)) return 'skill';
  if (/sport|gym|\brun|\bkm\b|workout|cycl|swim|football|basketball|training/.test(t)) return 'sport';
  return null;
}

export const GENRES = ['Self-help', 'Money & business', 'Fantasy', 'Sci-fi', 'Thriller', 'Biography', 'Classic', 'History', 'Romance', 'Manga / comics', 'Science'] as const;
export const SPORTS = ['Gym', 'Running', 'Football', 'Basketball', 'Cycling', 'Swimming', 'Martial arts', 'Tennis', 'Home workout', 'Other'] as const;
export const MEDITATIONS = ['Breathing', 'Body scan', 'Box breathing', 'Walking', 'Loving-kindness', 'Visualisation', 'Noting', 'Sleep / yoga nidra'] as const;

/** What the log asks for, per kind. */
export const LOG_SETUP: Record<GoalKind, { noun: string; textLabel?: string; tags: readonly string[]; tagLabel: string; minutes?: boolean }> = {
  books: { noun: 'book', textLabel: 'Book title', tags: GENRES, tagLabel: 'Genre' },
  sport: { noun: 'session', tags: SPORTS, tagLabel: 'Sport', minutes: true },
  meditation: { noun: 'session', tags: MEDITATIONS, tagLabel: 'Type', minutes: true },
  skill: { noun: 'session', textLabel: 'What did you learn?', tags: ['Coding', 'AI tools', 'Video editing', 'Design', 'Sales', 'Copywriting', 'Data', 'Language', 'Other'], tagLabel: 'Skill', minutes: true },
  art: { noun: 'session', textLabel: 'What did you make?', tags: ['Drawing', 'Music', 'Photography', 'Animation', 'Writing', 'Painting', 'Other'], tagLabel: 'Art', minutes: true },
};

const NEXT_BOOKS: Record<string, string[]> = {
  'Self-help': ['Atomic Habits (James Clear)', 'The 7 Habits of Highly Effective Teens (Sean Covey)', 'Mindset (Carol Dweck)', "Can't Hurt Me (David Goggins)", 'Deep Work (Cal Newport)'],
  'Money & business': ['Rich Dad Poor Dad (Robert Kiyosaki)', 'The Psychology of Money (Morgan Housel)', 'The Richest Man in Babylon (George Clason)', '$100M Offers (Alex Hormozi)', 'Zero to One (Peter Thiel)'],
  Fantasy: ['The Hobbit (J.R.R. Tolkien)', 'Mistborn (Brandon Sanderson)', 'The Name of the Wind (Patrick Rothfuss)', 'A Wizard of Earthsea (Ursula K. Le Guin)'],
  'Sci-fi': ['Project Hail Mary (Andy Weir)', 'Dune (Frank Herbert)', "Ender's Game (Orson Scott Card)", 'The Martian (Andy Weir)'],
  Thriller: ['The Silent Patient (Alex Michaelides)', 'Gone Girl (Gillian Flynn)', 'One of Us Is Lying (Karen McManus)', 'The Da Vinci Code (Dan Brown)'],
  Biography: ['Steve Jobs (Walter Isaacson)', 'Shoe Dog (Phil Knight)', 'Elon Musk (Walter Isaacson)', 'I Am Malala (Malala Yousafzai)'],
  Classic: ['1984 (George Orwell)', 'The Alchemist (Paulo Coelho)', 'Of Mice and Men (John Steinbeck)', 'Animal Farm (George Orwell)'],
  History: ['Sapiens (Yuval Noah Harari)', 'Guns, Germs, and Steel (Jared Diamond)', 'The Diary of Anne Frank', 'Band of Brothers (Stephen Ambrose)'],
  Romance: ['Pride and Prejudice (Jane Austen)', 'The Fault in Our Stars (John Green)', 'Me Before You (Jojo Moyes)'],
  'Manga / comics': ['One Piece', 'Attack on Titan', 'Vagabond', 'Maus (Art Spiegelman)'],
  Science: ['A Short History of Nearly Everything (Bill Bryson)', 'Why We Sleep (Matthew Walker)', 'Cosmos (Carl Sagan)', 'Thinking, Fast and Slow (Daniel Kahneman)'],
};

const SPORT_TIPS: Record<string, string> = {
  Gym: 'Write down your weights each session and add a little every week (progressive overload). That is how muscle actually grows.',
  Running: 'Run most of your km slow enough to talk. One faster run a week is plenty. Add no more than about 10% distance per week.',
  Football: 'Add 2 short sprint sessions a week and practise with your weaker foot. Small skills make the biggest difference in games.',
  Basketball: 'Shoot 50 free throws after each session and track how many go in. Your % this month vs. next month is real progress.',
  Cycling: 'One long easy ride a week builds endurance. Check your tyre pressure before every ride, it makes you faster for free.',
  Swimming: 'Mix it up: a few lengths easy, then short fast ones with rest. Technique beats strength in the water.',
  'Martial arts': 'Drill one technique until it is boring, then keep going. Sparring is where you learn, so stay calm and breathe.',
  Tennis: 'Spend 10 minutes per session only on your serve. Most points start there.',
  'Home workout': 'Push-ups, squats, lunges and planks are enough. Do a few more reps than last time, every time.',
  Other: 'Track how you feel after each session, not just how long. Your body will tell you when to push and when to rest.',
};

const MEDITATION_TIPS: Array<{ type: string; text: string }> = [
  { type: 'Box breathing', text: 'Box breathing: in for 4, hold 4, out for 4, hold 4. Used by athletes and soldiers to calm down fast. Great before a test.' },
  { type: 'Body scan', text: 'Body scan: lie down and move your attention slowly from your toes to your head, relaxing each part. Perfect before sleep.' },
  { type: 'Walking', text: 'Walking meditation: walk slowly and feel each step. Good on days when sitting still feels impossible.' },
  { type: 'Loving-kindness', text: 'Loving-kindness: silently wish yourself, a friend, and even someone annoying "be happy, be healthy". It makes you kinder and calmer.' },
  { type: 'Visualisation', text: 'Visualisation: picture yourself doing something well (a game, a talk, an exam) in detail. Top athletes do this every day.' },
  { type: 'Noting', text: 'Noting: when a thought comes, label it softly ("planning", "worry", "memory") and come back to your breath. It trains focus.' },
  { type: 'Sleep / yoga nidra', text: 'Yoga nidra: a guided lying-down practice that feels like a power nap. Try a 10-20 minute recording when you are tired.' },
  { type: 'Breathing', text: 'Breathing: just count breaths from 1 to 10, then start again. Lost count? That is normal, start at 1. That moment of noticing is the workout.' },
];

const HIGH_INCOME = [
  'Coding (web apps, like this one). Free start: freeCodeCamp or The Odin Project.',
  'AI automation: building tools and workflows with AI for small businesses.',
  'Video editing for YouTubers and TikTokers. Start with CapCut, then DaVinci Resolve (free).',
  'Copywriting: writing ads, emails and product pages that sell.',
  'Sales: every business needs people who can sell. Practise by selling something small.',
  'UI / graphic design. Figma is free; redesign apps you use as practice.',
  'Data analysis: Excel, then SQL and Python. Companies pay well for people who read numbers.',
  'Social media management for local shops and restaurants.',
];

const ART_IDEAS = [
  'Drawing: one sketch a day, 15 minutes. Copy artists you like, then make it your own.',
  'Music production: start free with BandLab or GarageBand and remake a beat you like.',
  'Photography: your phone is enough. Learn the rule of thirds and shoot at golden hour.',
  '3D and animation: Blender is free and used by pros. Follow the famous "donut" tutorial.',
  'Writing: short stories or a blog. 300 words a day adds up to a book in a year.',
  'Digital art: Procreate or Krita (free). Post your progress, people love seeing growth.',
];

export interface GoalTip {
  title: string;
  text: string;
}

function top(entries: GoalLogEntry[]): string | null {
  const counts = new Map<string, number>();
  for (const e of entries) if (e.tag) counts.set(e.tag, (counts.get(e.tag) ?? 0) + 1);
  let best: string | null = null;
  let n = 0;
  for (const [k, v] of counts) if (v > n) [best, n] = [k, v];
  return best;
}

/** Pick one from a list, changing day by day. */
function pick<T>(xs: T[], seed: number): T {
  return xs[Math.abs(seed) % xs.length];
}

export function goalTip(g: LongTermGoal, day = Math.floor(Date.now() / 86_400_000)): GoalTip | null {
  const kind = goalKind(g);
  if (!kind) return null;
  const log = g.log ?? [];
  if (kind === 'books') {
    const genre = top(log);
    if (!genre) return { title: 'Name every book', text: 'Log each book with its genre and you will get ideas for what to read next.' };
    const read = new Set(log.map((e) => (e.text ?? '').toLowerCase()));
    const next = (NEXT_BOOKS[genre] ?? []).filter((b) => ![...read].some((r) => r && b.toLowerCase().includes(r)));
    const others = GENRES.filter((x) => x !== genre && !log.some((e) => e.tag === x));
    const stretch = pick(others.length ? [...others] : [...GENRES], day);
    return {
      title: `You like ${genre.toLowerCase()}`,
      text: next.length
        ? `Next try: ${pick(next, day)}. Want to grow faster? Read one ${stretch.toLowerCase()} book too.`
        : `You've read the classics here. Try something new: a ${stretch.toLowerCase()} book.`,
    };
  }
  if (kind === 'sport') {
    const sport = top(log) ?? 'Other';
    const mins = log.reduce((n, e) => n + (e.minutes ?? 0), 0);
    const start = new Date(g.createdAt).getTime();
    const weeks = Math.max(1, (Date.now() - start) / (7 * 86_400_000));
    const perWeek = g.progress / weeks;
    const needed = g.timeframe === 'yearly' ? g.target / 52 : g.timeframe === 'monthly' ? g.target / 4.3 : 0;
    // Pace only means something after a couple of weeks.
    const pace = needed && weeks >= 2 ? (perWeek >= needed ? `You're on pace (${perWeek.toFixed(1)} a week).` : `You need about ${needed.toFixed(1)} a week to make it; you're at ${perWeek.toFixed(1)}.`) : '';
    return {
      title: log.length ? `${sport}: ${log.length} ${log.length === 1 ? 'session' : 'sessions'}${mins ? `, ${Math.round(mins / 60)} h` : ''}` : 'Log each session',
      text: `${pace} ${SPORT_TIPS[sport] ?? SPORT_TIPS.Other}`.trim(),
    };
  }
  if (kind === 'meditation') {
    const tried = new Set(log.map((e) => e.tag));
    const fresh = MEDITATION_TIPS.filter((m) => !tried.has(m.type));
    const m = pick(fresh.length ? fresh : MEDITATION_TIPS, day);
    return { title: fresh.length ? `Try something new: ${m.type.toLowerCase()}` : 'You have tried every type', text: m.text };
  }
  // Once you log what you practise, the tip follows your main skill; before that, a new idea each day.
  const main = top(log);
  const list = kind === 'skill' ? HIGH_INCOME : ART_IDEAS;
  const key = main?.toLowerCase().split(' ')[0];
  const match = key ? list.find((x) => x.toLowerCase().startsWith(key === 'ai' ? 'ai' : key === 'design' ? 'ui' : key === 'animation' ? '3d' : key === 'painting' ? 'digital' : key)) : undefined;
  if (match) return { title: `Your skill: ${main}`, text: match };
  return { title: kind === 'skill' ? 'High-income skill idea' : 'Art skill idea', text: pick(list, day) };
}

/** How much one journal entry adds: km for km goals, hours for hour goals, otherwise 1. */
export function logUnit(g: Pick<LongTermGoal, 'unit'>): 'km' | 'hours' | 'one' {
  const u = g.unit.toLowerCase();
  if (/\bkm\b|kilomet/.test(u)) return 'km';
  if (/hour|\bh\b/.test(u)) return 'hours';
  return 'one';
}

// ---- Pace and strategy (every goal, with or without a journal) ----

const SPAN_DAYS: Record<string, number> = { weekly: 7, monthly: 30, yearly: 365 };

export interface GoalPlan {
  /** Days left until the goal's year (or month/week) is over; null for custom goals. */
  daysLeft: number | null;
  /** 0..1 of the time used up so far. */
  timeUsed: number;
  /** 0..1 of the target reached. */
  done: number;
  status: 'ahead' | 'on-track' | 'behind' | 'just-started' | 'done';
  /** One clear line: what to do this week (or month) to make it. */
  action: string;
}

function per(n: number) {
  return n >= 10 ? Math.ceil(n) : Math.ceil(n * 10) / 10;
}

/** "1 book", "1.5 books": singular only for exactly one. */
function amount(n: number, unit: string) {
  const v = per(n);
  return `${v} ${v === 1 && /s$/.test(unit) && !/\s/.test(unit) ? unit.slice(0, -1) : unit}`;
}

/** Where you stand on a goal and the next concrete step, worked out from the dates and your progress. */
export function goalPlan(g: LongTermGoal, now = Date.now()): GoalPlan {
  const target = Math.max(g.target, 1);
  const done = Math.min(1, g.progress / target);
  const left = Math.max(0, target - g.progress);
  const span = SPAN_DAYS[g.timeframe];
  const unit = g.unit || 'steps';
  if (g.completedAt || left === 0) return { daysLeft: null, timeUsed: 1, done: 1, status: 'done', action: 'Done. Set the next, bigger goal.' };
  if (!span) {
    return { daysLeft: null, timeUsed: 0, done, status: done > 0 ? 'on-track' : 'just-started', action: `${amount(left, unit)} to go. Do a little every week.` };
  }
  const start = new Date(g.createdAt).getTime() || now;
  const usedDays = Math.max(0, (now - start) / 86_400_000);
  const daysLeft = Math.max(1, Math.ceil(span - usedDays));
  const timeUsed = Math.min(1, usedDays / span);
  const weeksLeft = Math.max(1, daysLeft / 7);
  const perWeek = left / weeksLeft;
  const action =
    g.timeframe === 'weekly'
      ? `${amount(left / daysLeft, unit)} a day finishes it this week.`
      : perWeek < 1
        ? `About ${amount(left / Math.max(1, daysLeft / 30), unit)} a month gets you there.`
        : `${amount(perWeek, unit)} a week gets you there.`;
  let status: GoalPlan['status'];
  if (usedDays < 7 && g.progress === 0) status = 'just-started';
  else if (done >= timeUsed + 0.05) status = 'ahead';
  else if (done >= timeUsed - 0.08) status = 'on-track';
  else status = 'behind';
  return { daysLeft, timeUsed, done, status, action };
}

/** How winners hit year-long goals. One a day, so the advice keeps changing. */
const STRATEGY: GoalTip[] = [
  { title: 'Make it tiny', text: 'Turn the year into one small weekly step. A big goal only feels big until you split it.' },
  { title: 'Give it a time', text: 'Put it in your Plan on a fixed day and time. Goals with a time slot get done 2 to 3 times more often.' },
  { title: 'Never miss twice', text: 'Missed a week? Fine. Just never miss two in a row. That one rule saves most goals.' },
  { title: 'Tell someone', text: 'Tell a friend your goal and send them your progress every month. You will not want to report a zero.' },
  { title: 'Track it the same day', text: 'Log progress right after you do it. What gets measured gets improved.' },
  { title: 'Remove the friction', text: 'Make the first step take 10 seconds: shoes by the door, book on your pillow, laptop open on the course.' },
  { title: 'Reward the milestones', text: 'At 25%, 50% and 75%, give yourself a treat from Rewards. Your brain loves a finish line.' },
  { title: 'Think in seasons', text: 'Every 3 months, look back: what worked, what didn’t? Change the plan, not the goal.' },
  { title: 'Identity first', text: 'Don’t say “I want to read”, say “I’m a reader”. Every session is a vote for who you are becoming.' },
  { title: 'Bad days count', text: 'On a low day, do the smallest version: one page, five minutes, one push-up. It keeps the chain alive.' },
  { title: 'Stack it', text: 'Attach it to something you already do: “after dinner, I practise 10 minutes”.' },
  { title: 'Compound effect', text: '1% better each day is 37 times better after a year. Small and steady beats big and rare.' },
];

/** Up to two tips for a goal: one that fits the kind of goal (if any) and one on how to hit it. */
export function goalTips(g: LongTermGoal, day = Math.floor(Date.now() / 86_400_000)): GoalTip[] {
  const out: GoalTip[] = [];
  const own = goalTip(g, day);
  if (own) out.push(own);
  const plan = goalPlan(g);
  if (plan.status === 'behind') out.push({ title: 'Catch up without stress', text: 'Add one extra session this week and one next week. Spread it out, never cram.' });
  else out.push(pick(STRATEGY, day + g.id.length));
  return out;
}

export const STATUS_LABEL: Record<GoalPlan['status'], string> = {
  ahead: 'Ahead of plan',
  'on-track': 'On track',
  behind: 'Behind, catch up',
  'just-started': 'Just started',
  done: 'Done',
};

/** Yearly goals first, then monthly, weekly and custom, so the big dreams stay on top. */
export function byPriority(a: LongTermGoal, b: LongTermGoal): number {
  const rank: Record<string, number> = { yearly: 0, monthly: 1, weekly: 2, custom: 3 };
  return (rank[a.timeframe] ?? 4) - (rank[b.timeframe] ?? 4);
}
