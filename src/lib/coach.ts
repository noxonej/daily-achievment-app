import type { AppState, DerivedStats } from './types';
import { QUEST_LIBRARY, type LibraryQuest } from '../data/questLibrary';
import { addDaysToKey, parseKey, todayKey } from './date';
import { hashString } from './hash';
import { WEEKDAYS, recurringItemsForDay } from './weekPlan';

/**
 * The coach: looks at how your last days actually went (quests, plan, mood, sleep, money)
 * and gives one or two personal tips, each with a button that does the fix for you.
 * Everything runs on the phone; nothing is sent anywhere.
 */
export type CoachAction =
  | { kind: 'add'; label: string; quest: LibraryQuest }
  | { kind: 'open'; label: string; to: 'plan' | 'money' | 'quests' | 'library' | 'focus' | 'diary' };

export interface CoachTip {
  id: string;
  icon: string;
  title: string;
  text: string;
  action?: CoachAction;
}

function lib(title: string): LibraryQuest | undefined {
  return QUEST_LIBRARY.find((q) => q.title === title);
}

function minutes(hhmm: string | undefined): number | null {
  if (!hhmm || !/^\d\d:\d\d$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Share of daily quests done on each of the last `days` days (only days the app knew about). */
function recentRates(state: AppState, today: string, days: number): Array<{ date: string; rate: number; any: boolean }> {
  const out: Array<{ date: string; rate: number; any: boolean }> = [];
  for (let i = 1; i <= days; i++) {
    const date = addDaysToKey(today, -i);
    const log = state.dayLogs[date];
    if (!log) continue;
    const done = log.completedQuestIds.length + (log.skipped?.length ?? 0);
    out.push({ date, rate: log.dailyQuestCount ? Math.min(1, done / log.dailyQuestCount) : done > 0 ? 1 : 0, any: done > 0 });
  }
  return out;
}

export function coachTips(state: AppState, stats: DerivedStats, today: string = todayKey()): CoachTip[] {
  const tips: CoachTip[] = [];
  const active = state.quests.filter((q) => !q.archived && !q.wildcardDate && !q.wildcardWeekKey);
  const daily = active.filter((q) => q.frequency === 'daily');
  const titles = new Set(active.map((q) => q.title.toLowerCase()));
  const has = (re: RegExp) => active.some((q) => re.test(q.title));
  const add = (title: string, label = 'Add this quest'): CoachAction | undefined => {
    const q = lib(title);
    return q && !titles.has(q.title.toLowerCase()) ? { kind: 'add', label, quest: q } : undefined;
  };
  const history = recentRates(state, today, 14);
  const week = history.filter((h) => h.date >= addDaysToKey(today, -7));
  const doneToday = (state.dayLogs[today]?.completedQuestIds.length ?? 0) > 0;
  const yesterday = state.dayLogs[addDaysToKey(today, -1)];
  const daysUsed = Object.keys(state.dayLogs).length;

  // 1. Missed yesterday: the most important moment to come back.
  if (daysUsed > 2 && yesterday && !yesterday.completedQuestIds.length && !(state.shieldedDates ?? []).includes(yesterday.date) && !doneToday) {
    tips.push({
      id: 'never-miss-twice',
      icon: '🔥',
      title: 'Never miss twice',
      text: 'Missing one day is normal. Missing two in a row is how habits die. Do your easiest quest right now, even if it is tiny.',
    });
  }

  // 2. Too much on the plate.
  const avgWeek = week.length ? week.reduce((n, h) => n + h.rate, 0) / week.length : 1;
  if (week.length >= 4 && daily.length >= 7 && avgWeek < 0.45) {
    tips.push({
      id: 'too-many',
      icon: '✂️',
      title: 'Fewer quests, more wins',
      text: `You finished about ${Math.round(avgWeek * 100)}% of your quests this week. That is a sign you have too many, not that you are lazy. Keep your best 4 or 5 and archive the rest for now.`,
      action: { kind: 'open', label: 'Choose my quests', to: 'quests' },
    });
  }

  // 3. Crushing it: time to level up.
  if (week.length >= 5 && avgWeek >= 0.95 && daily.length > 0 && daily.every((q) => q.difficulty === 'easy' || q.difficulty === 'medium')) {
    tips.push({
      id: 'level-up',
      icon: '🚀',
      title: 'Too easy? Level up',
      text: 'You have done almost everything every day this week. Growth happens just outside your comfort zone, so add one harder quest.',
      action: add('Deep work: 60 minutes', 'Add a hard quest') ?? { kind: 'open', label: 'Find a harder quest', to: 'library' },
    });
  }

  // 4. Weekend dip.
  const weekend = history.filter((h) => [0, 6].includes(parseKey(h.date).getDay()));
  const weekdays = history.filter((h) => ![0, 6].includes(parseKey(h.date).getDay()));
  if (weekend.length >= 2 && weekdays.length >= 4) {
    const we = weekend.reduce((n, h) => n + h.rate, 0) / weekend.length;
    const wd = weekdays.reduce((n, h) => n + h.rate, 0) / weekdays.length;
    if (wd - we > 0.35) {
      tips.push({
        id: 'weekend-dip',
        icon: '🏖️',
        title: 'Weekends are your weak spot',
        text: 'You do great on weekdays but drop off at the weekend, when there is no routine. Put one or two things into Saturday and Sunday mornings in your plan.',
        action: { kind: 'open', label: 'Plan my weekend', to: 'plan' },
      });
    }
  }

  // 5. Sleep: late bedtime in the profile or in the plan.
  const bed = minutes(state.profile?.bedTime);
  const wake = minutes(state.profile?.wakeTime);
  if (bed !== null && wake !== null) {
    const sleep = ((wake - bed + 24 * 60) % (24 * 60)) / 60;
    if (sleep > 0 && sleep < 7 && !has(/bed before|sleep|digital sunset/i)) {
      tips.push({
        id: 'sleep',
        icon: '😴',
        title: `Only ${sleep.toFixed(sleep % 1 ? 1 : 0)} hours of sleep`,
        text: 'Your bedtime and wake-up time leave less than 7 hours. Teens need 8 to 10. Sleep is when your brain stores what you learned and your body builds muscle.',
        action: add('Bed before 23:00') ?? add('Digital sunset'),
      });
    }
  }

  // 6. Mood has been low.
  const moods = [1, 2, 3].map((i) => state.moods?.[addDaysToKey(today, -i + 1)]).filter((m): m is NonNullable<typeof m> => !!m);
  if (moods.length >= 2 && moods.every((m) => m <= 2)) {
    tips.push({
      id: 'low-mood',
      icon: '💛',
      title: 'Rough few days',
      text: 'Go outside for a walk, move your body and talk to someone you trust. It really helps. If it keeps feeling heavy, tell a parent, teacher or doctor. That is strong, not weak.',
      action: add('Go outside for 15 minutes', 'Add a daily walk outside'),
    });
  }

  // 7. Basics missing.
  if (!has(/water/i)) {
    tips.push({
      id: 'water',
      icon: '💧',
      title: 'Drink more water',
      text: 'Even being a little thirsty makes you tired and less focused. A water quest with your own glass size makes it easy to track.',
      action: add('Drink 2L of water'),
    });
  }
  if (!has(/walk|run|steps|push|stretch|workout|gym|exercise|active|sport|yoga/i)) {
    tips.push({
      id: 'move',
      icon: '🚶',
      title: 'Move every day',
      text: 'None of your quests get you moving. A daily walk is the easiest habit with the biggest payoff: better mood, sleep and focus.',
      action: add('Walk 6,000 steps'),
    });
  }

  // 8. Plan and money basics.
  const planItems = WEEKDAYS.reduce((n, w) => n + recurringItemsForDay(state, w.id).length, 0);
  if (daysUsed >= 2 && planItems < 3) {
    tips.push({
      id: 'plan',
      icon: '📅',
      title: 'Give your week a shape',
      text: 'People who plan their week get far more done. Add when you wake up, school or work, and one fun thing. The app then also plans your spending around it.',
      action: { kind: 'open', label: 'Plan my week', to: 'plan' },
    });
  } else if (planItems >= 3) {
    const mornings = WEEKDAYS.slice(0, 5).filter((w) => recurringItemsForDay(state, w.id).some((i) => (minutes(i.time) ?? 9999) < 9 * 60)).length;
    if (mornings === 0) {
      tips.push({
        id: 'morning',
        icon: '🌅',
        title: 'Own your mornings',
        text: 'Your plan has nothing before 9:00. A short morning routine (water, make your bed, no phone for 30 minutes) starts the whole day on a win.',
        action: add('Morning without the phone') ?? { kind: 'open', label: 'Add a morning routine', to: 'plan' },
      });
    }
  }
  if (daysUsed >= 3 && !state.money?.income && (state.money?.accounts?.length ?? 0) === 0) {
    tips.push({
      id: 'money',
      icon: '💰',
      title: 'Start tracking your money',
      text: 'Write down how much you have and what you get each month. The app then tells you how much you can spend each day and still save.',
      action: { kind: 'open', label: 'Set up money', to: 'money' },
    });
  }

  // 9. Focus timer never used, but has study or work quests.
  if (daysUsed >= 3 && !Object.keys(state.focusMinutes ?? {}).length && has(/study|homework|read|work|learn|practi/i)) {
    tips.push({
      id: 'focus',
      icon: '⏱',
      title: 'Try the focus timer',
      text: '25 minutes with the phone face down, then a 5-minute break. It feels short, but it beats an hour of half-working.',
      action: { kind: 'open', label: 'Start a focus session', to: 'focus' },
    });
  }

  // 10. Comfort zone: no brave quests at all.
  if (daysUsed >= 5 && !has(/cold|stranger|compliment|ask|speak|new|fear|call/i)) {
    tips.push({
      id: 'comfort',
      icon: '🧗',
      title: 'Leave your comfort zone',
      text: 'Confidence grows from doing slightly scary things. Try one small brave quest a day, like giving a real compliment.',
      action: add('Give a genuine compliment') ?? add('Take a cold shower'),
    });
  }

  // 11. Reflection habit.
  if (daysUsed >= 7 && stats.currentStreak >= 3 && !Object.values(state.dayLogs).some((l) => l.freeNote?.trim())) {
    tips.push({
      id: 'diary',
      icon: '📕',
      title: 'Write one line a day',
      text: 'Writing what went well and what you would change is how you learn from your own days. One sentence is enough.',
      action: { kind: 'open', label: 'Open my diary', to: 'diary' },
    });
  }

  return tips;
}

const HIDE_KEY = 'dayforge-coach-hidden';

function hidden(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(HIDE_KEY) || '{}');
  } catch {
    return {};
  }
}

/** Tips the user said "not now" to stay away for a week. */
export function hideTip(id: string, today: string = todayKey()) {
  try {
    localStorage.setItem(HIDE_KEY, JSON.stringify({ ...hidden(), [id]: addDaysToKey(today, 7) }));
  } catch {
    // ignore
  }
}

export function visibleTips(tips: CoachTip[], today: string = todayKey()): CoachTip[] {
  const h = hidden();
  return tips.filter((t) => !h[t.id] || h[t.id] <= today);
}

/** A stable daily order among tips of equal weight, so it doesn't feel repetitive. */
export function rotate<T>(list: T[], today: string = todayKey(), keep = 2): T[] {
  if (list.length <= keep) return list;
  const [first, ...rest] = list;
  const start = hashString(today) % rest.length;
  return [first, ...rest.slice(start), ...rest.slice(0, start)].slice(0, keep);
}
