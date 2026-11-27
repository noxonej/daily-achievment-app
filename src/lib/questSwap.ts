import type { AppState, Difficulty, Quest } from './types';
import { QUEST_LIBRARY, type LibraryQuest } from '../data/questLibrary';
import { addDaysToKey, todayKey } from './date';

/**
 * Smarter quest swaps (2026-11-27).
 *
 * The old swap picked any library quest whose title wasn't already taken, so "Morning without the
 * phone (30 min)" could turn into "First hour without your phone": the same goal with another
 * number. Now every quest gets its *objective*: a set of themes (phone in the morning, social
 * media, sleep time, water, push-ups...) plus its key words with numbers, durations and filler
 * stripped. Two quests count as the same if they share a theme or most of their words.
 *
 * A replacement must be different from the quest you're swapping, from everything you already have
 * today, from what you swapped away or skipped lately, and from what swaps offered you lately. It
 * is never harder than the quest you couldn't do, so swapping is a fair way out, not a punishment.
 */

/** Themes: one regular expression each, matched on "title description" in lower case. */
const THEMES: Array<[string, RegExp]> = [
  ['phone-morning', /(morning|first (30|hour|minutes)|wak).*(phone|screen)|(phone|screen).*(morning|first|wak)|morning without/],
  ['phone-bed', /(phone|screen).*(bed|night|before sleep)|(bed|night).*(phone|screen)|digital sunset/],
  ['phone-away', /phone (in another room|away)|without (your |the )?phone|no phone|digital detox|screen time|phones?\b.*(away|without)/],
  ['social-media', /social media|unfollow|scroll|feed/],
  ['sleep-time', /\bbed before|sleep|bedtime|slow evening/],
  ['wake-time', /wake up|snooz|same time/],
  ['daylight', /daylight|sunlight|go outside|fresh air/],
  ['water', /water\b|glasses of water|\b\d+l\b|sugary drinks/],
  ['steps-walk', /steps|walk after|go for a (hike|long walk)|take the stairs|\bwalk\b/],
  ['run', /\brun\b|running|\bkm\b/],
  ['push', /push-?ups|pull-?ups/],
  ['legs', /squats|jumping jacks/],
  ['core', /plank|sit-?ups/],
  ['workout', /work ?out|train \d|try a new workout|sport/],
  ['stretch', /stretch|yoga|mobility|posture/],
  ['breath', /breath|meditat|silence/],
  ['read', /\bread\b|pages|book|article/],
  ['study', /study|course lesson|summarise what you studied/],
  ['language', /language|new words|\bwords in\b/],
  ['deep-work', /deep work|focused work|single-task|focus/],
  ['journal', /write (down|one|3)|journal|worry/],
  ['gratitude', /thank|grateful|proud of|did well/],
  ['plan', /plan (tomorrow|your week)|tomorrow.s top|prepare your bag/],
  ['spend', /spend|impulse|purchase|buying|no-spend|compare prices|wait 48/],
  ['save', /savings|save something|put \d+% |move money/],
  ['budget', /budget|account balance|monthly costs|track today.s spending/],
  ['invest', /invest|money (lesson|skill)/],
  ['tidy', /tidy|clean your desk|laundry|bedsheets|put things back|make your bed|gallery/],
  ['cook', /cook|meal prep|bring food/],
  ['food', /vegetable|fruit|breakfast|protein|junk food/],
  ['teeth', /floss|brush/],
  ['call-family', /grandparent|relative|family/],
  ['reach-out', /message someone|write a short note|reconnect|ask someone how|reach out|network/],
  ['talk-new', /conversation with someone new|say hi|eye contact|speak up|ask a question/],
  ['kindness', /kind (thing|for)|compliment|help at home|volunteer|make someone laugh/],
  ['side-project', /side project|own project|build a small|ship one/],
  ['business', /business|sale|sales pitch|earn|problem people|struggle with/],
  ['instrument', /instrument/],
  ['draw', /draw|design something/],
  ['create', /creative piece|story or poem|write \d+ words|playlist|photo|post (one|or share)/],
  ['skill', /skill|touch typing|learn to code/],
  ['avoid', /avoid|putting off|scares you/],
  ['cold', /cold shower/],
];

const STOP = new Set('a an the to of for and or in on at your you with one some do get have be it is any every each this that from out no not more less than up all'.split(' '));
const NUMBER = /\d+([.,]\d+)?/g;
const UNITS = /\b(minutes?|mins?|hours?|hrs?|seconds?|km|l|steps|pages|reps|times?|days?|week|weekly|daily|today|tonight|x)\b/g;

/** Themes come from the title (descriptions mention phones and such in passing, which would over-match). */
export function objectiveThemes(title: string): Set<string> {
  const text = title.toLowerCase();
  return new Set(THEMES.filter(([, re]) => re.test(text)).map(([id]) => id));
}

function stem(w: string): string {
  return w.replace(/(ing|ed|es|s)$/, '');
}

/** The quest's key words, without numbers, units or filler ("Run 5 km" → {run}). */
export function objectiveWords(title: string): Set<string> {
  const clean = title.toLowerCase().replace(/[’']/g, '').replace(NUMBER, ' ').replace(UNITS, ' ').replace(/[^a-z\s-]/g, ' ');
  return new Set(clean.split(/[\s-]+/).filter((w) => w.length > 2 && !STOP.has(w)).map(stem));
}

export interface Objective {
  title: string;
  description?: string;
}

/** True when two quests ask for basically the same thing (another number or wording doesn't count). */
export function sameObjective(a: Objective, b: Objective): boolean {
  if (a.title.trim().toLowerCase() === b.title.trim().toLowerCase()) return true;
  const ta = objectiveThemes(a.title);
  const tb = objectiveThemes(b.title);
  for (const t of ta) if (tb.has(t)) return true;
  const wa = objectiveWords(a.title);
  const wb = objectiveWords(b.title);
  if (!wa.size || !wb.size) return false;
  let both = 0;
  for (const w of wa) if (wb.has(w)) both++;
  return both / Math.min(wa.size, wb.size) >= 0.6;
}

const LEVEL: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2, epic: 3 };

/** What happened lately: quests swapped away, skipped, and the replacements swaps already gave. */
export function swapHistory(state: Pick<AppState, 'dayLogs' | 'quests'>, today = todayKey()): { away: Objective[]; skipped: Objective[]; offered: Objective[] } {
  const away: Objective[] = [];
  const skipped: Objective[] = [];
  const offered: Objective[] = [];
  const byId = new Map(state.quests.map((q) => [q.id, q]));
  for (let i = 0; i < 14; i++) {
    const log = state.dayLogs[addDaysToKey(today, -i)];
    if (!log) continue;
    for (const [id, rep] of Object.entries(log.swaps ?? {})) {
      const q = byId.get(id);
      if (q) away.push({ title: q.title, description: q.description });
      if (i < 7) offered.push(rep);
    }
    if (i < 7)
      for (const id of log.skipped ?? []) {
        const q = byId.get(id);
        if (q) skipped.push({ title: q.title, description: q.description });
      }
  }
  return { away, skipped, offered };
}

/** Safe, doable fallbacks if the library runs dry. */
const FALLBACK: LibraryQuest[] = [
  { title: 'Take a 10-minute walk', description: 'Fresh air, no phone.', frequency: 'daily', difficulty: 'easy', icon: '🚶', category: 'Body' },
  { title: 'Drink a big glass of water', description: 'Right now, then once more later.', frequency: 'daily', difficulty: 'easy', icon: '💧', category: 'Body' },
  { title: 'Tidy one small spot', description: 'A shelf, a drawer or your desk.', frequency: 'daily', difficulty: 'easy', icon: '🧹', category: 'Life' },
  { title: 'Send one kind message', description: 'To a friend or someone in your family.', frequency: 'daily', difficulty: 'easy', icon: '💬', category: 'Social' },
];

export interface Replacement {
  title: string;
  description?: string;
  icon: string;
  /** Why it was picked (shown small under the option). */
  why: 'same-area' | 'easier' | 'fresh';
}

/**
 * Up to `n` genuinely different, doable replacements for `quest`: first one from the same life
 * area (so you still work on what you wanted), then the rest from other areas, never harder than
 * the original. `rand` is injectable for tests.
 */
export function swapOptions(state: Pick<AppState, 'dayLogs' | 'quests'>, quest: Quest, n = 3, rand: () => number = Math.random, today = todayKey()): Replacement[] {
  const hist = swapHistory(state, today);
  const todays = state.dayLogs[today]?.swaps ?? {};
  const avoid: Objective[] = [
    { title: quest.title, description: quest.description },
    ...state.quests.filter((q) => !q.archived && q.id !== quest.id).map((q) => ({ title: q.title, description: q.description })),
    ...Object.values(todays),
    ...hist.away,
    ...hist.skipped,
    ...hist.offered,
  ];
  const max = Math.min(LEVEL[quest.difficulty ?? 'medium'] ?? 1, 1); // never harder, and never above medium
  const fits = (l: LibraryQuest) => l.frequency === 'daily' && !l.measure && !l.promptForNote && LEVEL[l.difficulty] <= max;
  const pool = QUEST_LIBRARY.filter(fits).filter((l) => !avoid.some((a) => sameObjective(a, l)));
  // No two options may be the same as each other either.
  const shuffled = pool.map((l) => [rand(), l] as const).sort((a, b) => a[0] - b[0]).map(([, l]) => l);
  const category = QUEST_LIBRARY.find((l) => l.title === quest.title)?.category;
  const out: Replacement[] = [];
  const add = (l: LibraryQuest, why: Replacement['why']) => {
    if (out.length >= n || out.some((o) => sameObjective(o, l))) return;
    out.push({ title: l.title, description: l.description, icon: l.icon, why });
  };
  const same = category ? shuffled.find((l) => l.category === category) : undefined;
  if (same) add(same, LEVEL[same.difficulty] < LEVEL[quest.difficulty ?? 'medium'] ? 'easier' : 'same-area');
  for (const l of shuffled) if (l.category !== category) add(l, LEVEL[l.difficulty] < LEVEL[quest.difficulty ?? 'medium'] ? 'easier' : 'fresh');
  for (const l of shuffled) add(l, 'fresh');
  for (const l of FALLBACK) if (!avoid.some((a) => sameObjective(a, l))) add(l, 'easier');
  return out;
}
