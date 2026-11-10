import type { Quest } from './types';
import { hashString } from './hash';

/**
 * Daily twists: some days a built-in daily quest asks for a little more, a little less, or
 * the same thing in a different shape (2.5 L of water instead of 2 L, meditate 5 minutes or
 * twice for 5 minutes instead of 10). It keeps the list from feeling the same every day.
 * Picked from the date and quest id, so every device shows the same twist for the day.
 */
export interface Twist {
  title: string;
  description?: string;
  /** New target for number quests (glasses, steps…). */
  target?: number;
  /** New number of entries for list quests (Gratitude x3). */
  noteList?: number;
}

const TWISTS: Record<string, Twist[]> = {
  'Drink 2L of water': [
    { title: 'Drink 2.5L of water', description: 'A bit more than usual today. Keep a bottle close.', target: 10 },
    { title: 'Drink 3L of water', description: 'Big water day. Start with two glasses in the morning.', target: 12 },
  ],
  'Meditate 10 minutes': [
    { title: 'Meditate 5 minutes', description: 'A quick one today. Five calm minutes still count.' },
    { title: 'Meditate 2 × 5 minutes', description: 'Once in the morning, once in the evening.' },
    { title: 'Meditate 15 minutes', description: 'A longer sit today. Use the Breathe tool if it helps.' },
  ],
  'Read 15 pages': [
    { title: 'Read 10 pages', description: 'A lighter reading day. Ten good pages.' },
    { title: 'Read 25 pages', description: 'Get properly into your book today.' },
    { title: 'Read for 20 minutes', description: 'Set a timer and read until it rings.' },
  ],
  'Move your body': [
    { title: 'Move your body for 30 minutes', description: 'A longer session: gym, sport, a long walk or a bike ride.' },
    { title: 'Stretch and mobility, 15 minutes', description: 'Easy day: loosen your hips, back and shoulders.' },
    { title: 'Walk outside for 25 minutes', description: 'Fresh air and daylight, no running needed.' },
  ],
  'Walk 8,000 steps': [
    { title: 'Walk 7,000 steps', description: "A slightly easier step day. Enter today's steps from your phone.", target: 7000 },
    { title: 'Walk 10,000 steps', description: 'A big walking day. Take the long way everywhere.', target: 10000 },
  ],
  'Tidy your space': [
    { title: 'Tidy one drawer or shelf', description: 'Small space, real difference.' },
    { title: 'Clear your desk completely', description: 'Only what you need stays on it.' },
  ],
  'Gratitude x3': [
    { title: 'Gratitude x5', description: 'Five things today, big or small.', noteList: 5 },
  ],
  'No junk food': [
    { title: 'Eat a fruit and a vegetable at every meal', description: 'Add the good stuff instead of only cutting the bad.' },
    { title: 'No sugary drinks today', description: 'Water, tea or milk instead.' },
  ],
  Journal: [
    { title: 'Journal: what did you learn today?', description: 'Write a few lines about one thing you learned.' },
    { title: 'Journal: what are you proud of?', description: 'A few lines about something you did well.' },
  ],
};

/** Roughly 2 days in 5 a quest gets a twist. */
const TWIST_CHANCE = 40;

export function twistFor(baseTitle: string, questId: string, date: string): Twist | null {
  const options = TWISTS[baseTitle];
  if (!options) return null;
  const h = hashString(`${date}|twist|${questId}`);
  if (h % 100 >= TWIST_CHANCE) return null;
  return options[Math.floor(h / 100) % options.length];
}

/** The quest as it is without today's twist (its own title, target and text). */
export function untwisted(q: Quest): Quest {
  if (!q.twist) return q;
  const { twist, ...rest } = q;
  return {
    ...rest,
    title: twist.baseTitle,
    description: twist.baseDescription,
    measure: rest.measure && twist.baseTarget !== undefined ? { ...rest.measure, target: twist.baseTarget } : rest.measure,
    noteList: twist.baseNoteList !== undefined ? twist.baseNoteList : rest.noteList,
  };
}

/** Puts today's twist on every built-in daily quest that has one, and takes yesterday's off. */
export function applyDailyTwists(quests: Quest[], date: string): Quest[] {
  let changed = false;
  const next = quests.map((q) => {
    if (q.twist?.date === date) return q;
    const base = untwisted(q);
    if (base.custom || base.frequency !== 'daily' || base.wildcardDate) {
      if (base !== q) changed = true;
      return base;
    }
    const t = twistFor(base.title, base.id, date);
    if (!t) {
      if (base !== q) changed = true;
      return base;
    }
    changed = true;
    return {
      ...base,
      title: t.title,
      description: t.description ?? base.description,
      measure: base.measure && t.target !== undefined ? { ...base.measure, target: t.target } : base.measure,
      noteList: t.noteList ?? base.noteList,
      twist: {
        date,
        baseTitle: base.title,
        baseDescription: base.description,
        baseTarget: base.measure && t.target !== undefined ? base.measure.target : undefined,
        baseNoteList: t.noteList !== undefined ? base.noteList : undefined,
      },
    };
  });
  return changed ? next : quests;
}
