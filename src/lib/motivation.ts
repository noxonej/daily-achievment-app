import { addDaysToKey } from './date';
import { hashString } from './hash';

/**
 * Three motivational notifications a day.
 *
 * One plan, used everywhere: the app works out the exact moments and messages for the next 14 days,
 * and hands the same list to (1) the in-app check while Squzo is open or in the background, (2) the
 * service worker (Android background sync) and (3) Squzo's push sender (scripts/push), which delivers
 * them with the app fully closed. Because everybody reads the same list, a message is never sent
 * twice: each one has a tag, and the phone replaces a notification with the same tag.
 *
 * Moments are spread over your day: the time between "earliest" and "latest" is cut into equal parts
 * and each message lands at a random-looking (but fixed) minute in the middle of its part, so they
 * feel natural instead of robotic, and never land in quiet hours.
 */
export type Line = { title: string; body: string };

/** Lines Jonas asked for first, then more in the same voice: short, honest, never mean. */
export const MOTIVATION: Line[] = [
  { title: 'It’s you vs. you.', body: 'Open Squzo and beat yesterday’s version of you.' },
  { title: 'Your future self is watching.', body: 'Make today count. One quest is enough to start.' },
  { title: 'Small steps today.', body: 'Big results tomorrow. Tick off one quest now.' },
  { title: 'Don’t break the promises you made to yourself.', body: 'Your quests are waiting in Squzo.' },
  { title: 'Discipline beats motivation.', body: 'You don’t have to feel like it. Just start the easiest quest.' },
  { title: 'Nobody is coming to do it for you.', body: 'Good news: that means you’re in charge. Open Squzo.' },
  { title: 'One percent better.', body: 'That’s the whole plan for today. One small win.' },
  { title: 'The hard thing first.', body: 'The quest you’re avoiding is the one that changes you.' },
  { title: 'Phone in your hand anyway?', body: 'Use the next two minutes for a quest instead of a scroll.' },
  { title: 'Average is easy.', body: 'You didn’t download Squzo to be average.' },
  { title: 'Make it a day you’re proud of.', body: 'Check your quests and pick one to finish now.' },
  { title: 'Progress, not perfection.', body: 'It doesn’t have to be great. It has to be done.' },
  { title: 'Feelings follow actions.', body: 'Move first. The motivation shows up after.' },
  { title: 'Small wins add up.', body: 'Ten minutes a day is sixty hours a year. Start yours.' },
  { title: 'Win the morning, win the day.', body: 'Open Squzo and set the tone with one quick quest.' },
  { title: 'Keep the streak alive.', body: 'One quest a day is all it takes.' },
  { title: 'Build the life you want.', body: 'Every quest you finish builds your World in Squzo.' },
  { title: 'Today is a good day to start.', body: 'Not Monday. Not tomorrow. Today.' },
  { title: 'Champions are made when nobody watches.', body: 'Nobody is watching right now. Perfect time.' },
  { title: 'Hard choices, easy life.', body: 'Easy choices, hard life. Pick the quest.' },
  { title: 'Ready is a myth.', body: 'You will never feel 100% ready. Start anyway.' },
  { title: 'Your goals don’t take days off.', body: 'Neither do the people reaching theirs. One quest.' },
  { title: 'Earn your rest.', body: 'Finish a quest, then relax without the guilt.' },
  { title: 'Proof beats promises.', body: 'Show yourself you meant it. Open Squzo.' },
  { title: 'Don’t wait to be motivated.', body: 'Two minutes of action beats two hours of thinking.' },
  { title: 'Comfort is nice. Growth is better.', body: 'Do one thing today your future self will thank you for.' },
  { title: 'Be the person you said you’d be.', body: 'Your quests are the plan. Go do one.' },
  { title: 'You’ve done hard things before.', body: 'This one is smaller. Open Squzo.' },
  { title: 'The best time was yesterday.', body: 'The second best time is right now.' },
  { title: 'Every rep counts.', body: 'Every page, every glass of water, every step. Log it.' },
  { title: 'Stay hungry.', body: 'Your next level is closer than you think.' },
  { title: 'Show up, even on boring days.', body: 'Boring days are where streaks are won.' },
  { title: 'Don’t trade what you want most', body: 'for what you want right now. One quest first.' },
  { title: 'Keep the promise.', body: 'Confidence is built from promises you keep to yourself.' },
  { title: 'Less scrolling, more living.', body: 'Put the phone down after one quest. See how it feels.' },
  { title: 'You vs. yesterday.', body: 'Yesterday’s you set the bar. Raise it a little.' },
  { title: 'A quick check-in.', body: 'How are your quests going? Open Squzo and see.' },
  { title: 'Little by little.', body: 'A little becomes a lot. Keep going.' },
  { title: 'Make your future self proud.', body: 'They’re built from what you do today.' },
  { title: 'No zero days.', body: 'Even a tiny quest is more than nothing.' },
  { title: 'Your World is waiting.', body: 'Finish a quest, earn coins, upgrade your room.' },
  { title: 'Consistency is a superpower.', body: 'Most people quit. Be the one who doesn’t.' },
  { title: 'Drink some water.', body: 'Then come back and crush one quest.' },
  { title: 'Remember why you started.', body: 'That reason is still there. Open Squzo.' },
  { title: 'Stack another win.', body: 'You’re one quest away from a better day.' },
  { title: 'Focus on the next step.', body: 'Not the whole mountain. Just the next step.' },
];

/** The last message of a day, when no quest is done yet and a streak is on the line. */
export const STREAK_RISK: Line[] = [
  { title: '🔥 {n} days. Don’t let it end tonight.', body: 'One quest keeps your streak alive. It takes two minutes.' },
  { title: 'Your {n}-day streak needs you.', body: 'Midnight is coming. One small quest saves it.' },
  { title: '{n} days of work.', body: 'Protect them with one quest before bed.' },
  { title: 'Still time.', body: 'Your {n}-day streak is safe if you finish one quest today.' },
];

export interface MotivationPrefs {
  on: boolean;
  /** 1–3 a day. */
  perDay: number;
  /** Earliest and latest minute of the day a message may arrive (quiet hours are outside this). */
  from: number;
  to: number;
}

export interface Planned extends Line {
  /** When to show it (milliseconds since 1970, an exact moment). */
  at: number;
  /** Same tag = same notification, so it can never show twice. */
  tag: string;
  /** Local date (YYYY-MM-DD) and which message of the day this is. */
  date: string;
  slot: number;
  /** Shown instead when no quest is done that day and you have a streak (last message of the day only). */
  risk?: Line;
}

export const MIN_GAP_MINUTES = 90;

export function hhmmToMinutes(hhmm: string | undefined, fallback: number): number {
  if (!hhmm || !/^\d\d:\d\d$/.test(hhmm)) return fallback;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToHhmm(m: number): string {
  const h = Math.floor(m / 60) % 24;
  return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** The minutes of the day each message lands on for a given date. */
export function slotMinutes(p: MotivationPrefs, date: string, salt = ''): number[] {
  const n = Math.max(1, Math.min(3, Math.round(p.perDay)));
  const from = Math.max(0, Math.min(p.from, 23 * 60));
  const to = Math.max(from + 30, Math.min(p.to, 23 * 60 + 59));
  const part = (to - from) / n;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    // Middle 70% of each part, so two messages never come close together.
    const r = (hashString(`slot|${salt}|${date}|${i}`) % 1000) / 1000;
    out.push(Math.round(from + part * i + part * (0.15 + 0.7 * r)));
  }
  return out;
}

function fill(line: Line, vars: Record<string, string | number>): Line {
  const f = (s: string) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
  return { title: f(line.title), body: f(line.body) };
}

/** A fixed shuffle of the lines for one person, so everyone gets a different order. */
function order(salt: string): number[] {
  const idx = MOTIVATION.map((_, i) => i);
  let seed = hashString(`order|${salt}`) || 1;
  for (let i = idx.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

/** Days since 2026-01-01, used to walk through the lines without repeats. */
function dayNumber(date: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse('2026-01-01T00:00:00Z')) / 86400000);
}

/**
 * Messages for one day. Lines walk through a personal shuffle, so with 46 lines and 3 a day you
 * see each one only once every 15 days.
 */
export function linesFor(date: string, count: number, salt = ''): Line[] {
  const o = order(salt);
  const start = (dayNumber(date) * 3) % o.length;
  return Array.from({ length: count }, (_, i) => MOTIVATION[o[(((start + i) % o.length) + o.length) % o.length]]);
}

/** Local date + minute → exact moment, in this device's time zone. */
function atLocal(date: string, minute: number): number {
  const [y, mo, d] = date.split('-').map(Number);
  return new Date(y, mo - 1, d, Math.floor(minute / 60), minute % 60, 0, 0).getTime();
}

/** The next `days` days of messages, starting today. Past moments of today are left out. */
export function planMotivation(p: MotivationPrefs, today: string, opts: { days?: number; streak?: number; salt?: string; now?: number } = {}): Planned[] {
  if (!p.on) return [];
  const days = opts.days ?? 14;
  const now = opts.now ?? Date.now();
  const salt = opts.salt ?? '';
  const out: Planned[] = [];
  for (let d = 0; d < days; d++) {
    const date = addDaysToKey(today, d);
    const mins = slotMinutes(p, date, salt);
    const lines = linesFor(date, mins.length, salt);
    mins.forEach((m, slot) => {
      const at = atLocal(date, m);
      if (at < now - 30 * 60 * 1000) return;
      // The day's last message can turn into a streak warning. Whoever sends it checks that day:
      // nothing done yet, but something done the day before (so a streak is really on the line).
      const last = slot === mins.length - 1;
      const streak = opts.streak ?? 0;
      const risk = last && streak > 0 ? fill(STREAK_RISK[hashString(`risk|${date}`) % STREAK_RISK.length], { n: streak + d }) : undefined;
      out.push({ ...lines[slot], at, tag: `squzo-${date}-${slot}`, date, slot, risk });
    });
  }
  return out;
}

/** The line to show: the streak warning when the day has nothing done yet but the day before did. */
export function lineToShow(x: Planned, lastDone: string | undefined): Line {
  if (!x.risk) return { title: x.title, body: x.body };
  // lastDone = the most recent day with a finished quest. The day before = streak still alive, not done yet.
  return lastDone === addDaysToKey(x.date, -1) ? x.risk : { title: x.title, body: x.body };
}

/** Which planned message (if any) is due right now: at or after its time, and not more than 45 minutes late. */
export function dueNow(plan: Planned[], sent: Record<string, true>, now = Date.now()): Planned | null {
  const LATE = 45 * 60 * 1000;
  return plan.find((x) => x.at <= now && now - x.at < LATE && !sent[x.tag]) ?? null;
}
