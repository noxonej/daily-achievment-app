import type { AppState, SleepEntry, SleepState } from './types';

/**
 * Sleep: how much you need, bedtime maths, your log and tips.
 *
 * Hours per age follow the American Academy of Sleep Medicine (children and teens) and the
 * AASM / Sleep Research Society and CDC (adults). A sleep cycle is about 90 minutes on average
 * (it varies, roughly 70–120), and most people need 10–20 minutes to fall asleep.
 */
export type AgeBand = 'kid' | 'teen' | 'young' | 'adult' | 'senior';

export const AGE_BANDS: Array<{ id: AgeBand; label: string; ages: string; min: number; max: number; ideal: number }> = [
  { id: 'kid', label: 'Kid', ages: '6–12', min: 9, max: 12, ideal: 10 },
  { id: 'teen', label: 'Teen', ages: '13–17', min: 8, max: 10, ideal: 9 },
  { id: 'young', label: 'Young adult', ages: '18–25', min: 7, max: 9, ideal: 8 },
  { id: 'adult', label: 'Adult', ages: '26–64', min: 7, max: 9, ideal: 8 },
  { id: 'senior', label: 'Older adult', ages: '65+', min: 7, max: 8, ideal: 7.5 },
];

export const CYCLE_MIN = 90;
export const DEFAULT_FALL_ASLEEP = 15;

export function bandOf(sleep: SleepState | undefined) {
  return AGE_BANDS.find((b) => b.id === (sleep?.band ?? 'teen')) ?? AGE_BANDS[1];
}

/** Your sleep need in hours: what you set, or the middle of your age group's range. */
export function sleepNeed(sleep: SleepState | undefined): number {
  return sleep?.needHours ?? bandOf(sleep).ideal;
}

export function fallAsleepMin(sleep: SleepState | undefined): number {
  return sleep?.fallAsleep ?? DEFAULT_FALL_ASLEEP;
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
export const toHHMM = (min: number) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

export interface SleepOption {
  /** Bedtime (or wake time) as HH:MM. */
  time: string;
  cycles: number;
  hours: number;
  best: boolean;
  short: boolean;
}

/** The cycle count closest to your need (never more than 45 minutes short of it when possible). */
function bestCycles(need: number, counts: number[]) {
  return counts.reduce((a, b) => (Math.abs(b * 1.5 - need) < Math.abs(a * 1.5 - need) ? b : a));
}

/** "I want to wake up at…" → when to go to bed (in bed, lights off). */
export function bedtimesFor(wake: string, need: number, fallAsleep: number): SleepOption[] {
  const counts = [6, 5, 4];
  const best = bestCycles(need, counts);
  return counts.map((c) => ({
    time: toHHMM(toMin(wake) - c * CYCLE_MIN - fallAsleep),
    cycles: c,
    hours: c * 1.5,
    best: c === best,
    short: c * 1.5 < need - 1,
  }));
}

/** "If I go to bed now…" → when to wake up. */
export function wakeTimesFor(nowMin: number, need: number, fallAsleep: number): SleepOption[] {
  const counts = [4, 5, 6];
  const best = bestCycles(need, counts);
  return counts.map((c) => ({
    time: toHHMM(nowMin + fallAsleep + c * CYCLE_MIN),
    cycles: c,
    hours: c * 1.5,
    best: c === best,
    short: c * 1.5 < need - 1,
  }));
}

/** Bedtime for exactly your sleep need. */
export function bedtimeForNeed(wake: string, need: number, fallAsleep: number): string {
  return toHHMM(toMin(wake) - need * 60 - fallAsleep);
}

export function formatHours(h: number): string {
  const total = Math.round(h * 60);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return mm ? `${hh}h ${mm}m` : `${hh}h`;
}

/** Hours slept between going to bed and waking, minus the time it took to fall asleep. */
export function hoursBetween(startIso: string, endIso: string, fallAsleep: number): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(0, Math.round(((ms / 60000 - fallAsleep) / 60) * 100) / 100);
}

export interface SleepSummary {
  nights: SleepEntry[];
  avg: number | null;
  enough: number;
  tiredWhenShort: boolean;
  advice: string;
}

/** The last 7 nights and what they say. */
export function sleepSummary(state: Pick<AppState, 'sleep'>): SleepSummary {
  const need = sleepNeed(state.sleep);
  const nights = [...(state.sleep?.log ?? [])].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  if (!nights.length) {
    return { nights, avg: null, enough: 0, tiredWhenShort: false, advice: 'Log a few nights and you will see how much you really sleep and how it makes you feel.' };
  }
  const avg = nights.reduce((n, e) => n + e.hours, 0) / nights.length;
  const enough = nights.filter((e) => e.hours >= need - 0.25).length;
  const short = nights.filter((e) => e.hours < need - 0.25 && e.feel);
  const long = nights.filter((e) => e.hours >= need - 0.25 && e.feel);
  const avgFeel = (xs: SleepEntry[]) => (xs.length ? xs.reduce((n, e) => n + (e.feel ?? 2), 0) / xs.length : 0);
  const tiredWhenShort = short.length >= 2 && long.length >= 1 && avgFeel(short) < avgFeel(long);
  const tiredAnyway = long.length >= 3 && avgFeel(long) < 1.7;
  let advice: string;
  if (tiredAnyway) advice = 'You sleep enough but still wake up tired. Try 30 minutes more, a steadier bedtime, or less screen time late. If it lasts for weeks, talk to a doctor.';
  else if (tiredWhenShort) advice = `You feel better on nights with ${formatHours(need)} or more. That's your body telling you your need is real.`;
  else if (avg < need - 0.75) advice = `You average ${formatHours(avg)}, about ${formatHours(need - avg)} less than you need. Try going to bed 15 minutes earlier each week.`;
  else if (avg > need + 1.5) advice = 'You sleep a lot more than usual. That can be fine (growing, sport, catching up), but if you are always tired, mention it to a doctor.';
  else advice = 'Nice: you are close to what you need. Keep the same bed and wake times, even on weekends.';
  return { nights, avg, enough, tiredWhenShort, advice };
}

/** Tips that hold up in sleep research (not hacks). */
export const SLEEP_TIPS: Array<{ icon: string; title: string; text: string }> = [
  { icon: '⏰', title: 'Same times every day', text: 'Go to bed and wake up at about the same time, weekends too (within an hour). A steady rhythm is the single most useful habit for good sleep.' },
  { icon: '☀', title: 'Daylight in the morning', text: '10–20 minutes of daylight soon after waking sets your body clock, so you feel sleepy at the right time in the evening.' },
  { icon: '☕', title: 'No caffeine after lunch', text: 'Coffee, energy drinks, cola and strong tea keep working for hours (half of it is still in you 5 hours later). Stop about 8 hours before bed.' },
  { icon: '📵', title: 'Dim screens for the last hour', text: 'Bright light and exciting videos late at night push your sleep later. Use night mode, turn brightness down, or put the phone away.' },
  { icon: '🌙', title: 'Cool, dark and quiet', text: 'A slightly cool room (around 18 °C / 65 °F), dark curtains or an eye mask, and earplugs or steady noise help you stay asleep.' },
  { icon: '🛏', title: 'Bed is for sleep', text: 'Can’t sleep after about 20 minutes? Get up, do something calm in dim light, and go back when you feel sleepy. Lying there frustrated teaches your brain that bed means awake.' },
  { icon: '🍽', title: 'No big meals right before bed', text: 'Finish big meals 2–3 hours before bed. A small snack is fine if you are hungry.' },
  { icon: '🏃', title: 'Move during the day', text: 'Regular exercise helps you fall asleep faster and sleep deeper. Just avoid very hard workouts in the last hour or two.' },
  { icon: '😴', title: 'Short naps, early', text: 'If you nap, keep it to 20–30 minutes and before mid-afternoon, so you still feel sleepy at night.' },
  { icon: '🌬', title: 'Wind down', text: 'Give yourself 30 minutes to slow down: shower, read, stretch, or a breathing session. Write tomorrow’s to-dos down so they leave your head.' },
  { icon: '🎓', title: 'For teens', text: 'Your body clock naturally shifts later in your teens, so feeling awake at night is normal. That makes a fixed wake-up time and morning light even more important.' },
  { icon: '🩺', title: 'When to see a doctor', text: 'Loud snoring with pauses in breathing, falling asleep in class or while driving, or trouble sleeping most nights for weeks: talk to a doctor. These are common and treatable.' },
];

/** Daily quests that a logged night can tick off: "Get 7+ hours of sleep" and "Bed before 23:00". */
export function sleepQuestsDone(state: AppState, entry: SleepEntry): string[] {
  const ids: string[] = [];
  for (const q of state.quests) {
    if (q.archived || q.frequency !== 'daily' || q.measure || q.promptForNote) continue;
    const hours = q.title.match(/(\d+(?:[.,]\d+)?)\+?\s*h(?:ours?)?\s+(?:of\s+)?sleep/i);
    if (hours && entry.hours >= Number(hours[1].replace(',', '.'))) ids.push(q.id);
    const before = q.title.match(/bed before (\d{1,2})[:.](\d{2})/i);
    if (before) {
      const start = new Date(entry.start);
      const startMin = start.getHours() * 60 + start.getMinutes();
      const limit = Number(before[1]) * 60 + Number(before[2]);
      // Counts if you went to bed in the evening, before the limit.
      if (startMin >= 18 * 60 && startMin <= limit) ids.push(q.id);
    }
  }
  return ids;
}
