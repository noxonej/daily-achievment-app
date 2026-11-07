import type { AppState, WeekdayId } from './types';
import { addDaysToKey, todayKey } from './date';
import { WEEKDAYS, weekdayOfDate } from './weekPlan';

/**
 * Quick add: type one line in plain words and the app works out what it is, like the quick-add
 * box in the best to-do apps.
 *   "dentist tomorrow 15:00"      → a one-time plan event
 *   "gym every monday 17:30"      → a weekly plan item
 *   "spent 4.50 on lunch" / "4.5 lunch" → an expense
 *   "every day: read 10 pages"    → a new daily quest
 *   anything else                 → a to-do for today
 */
export type Parsed =
  | { kind: 'event'; text: string; date: string; time?: string }
  | { kind: 'weekly'; text: string; days: WeekdayId[]; time?: string }
  | { kind: 'expense'; amount: number; note: string; categoryId: string }
  | { kind: 'quest'; title: string }
  | { kind: 'task'; text: string };

const DAY_WORDS: Record<string, WeekdayId> = {
  mon: 'mon', monday: 'mon', tue: 'tue', tues: 'tue', tuesday: 'tue', wed: 'wed', wednesday: 'wed',
  thu: 'thu', thur: 'thu', thurs: 'thu', thursday: 'thu', fri: 'fri', friday: 'fri', sat: 'sat', saturday: 'sat', sun: 'sun', sunday: 'sun',
};

const CATEGORY_WORDS: Array<[string, RegExp]> = [
  ['food', /\b(lunch|dinner|breakfast|food|snack|coffee|pizza|burger|kebab|drink|drinks|cola|groceries|grocery|sweets|candy|cafe|restaurant|mcdonald|bubble tea|ice cream)\b/i],
  ['transport', /\b(bus|train|taxi|uber|bolt|ticket|fuel|petrol|gas|metro|tram|scooter|parking)\b/i],
  ['fun', /\b(cinema|movie|game|games|concert|party|bowling|skins|robux|v-?bucks|spotify|netflix|fun|club)\b/i],
];

function cleanup(s: string): string {
  return s.replace(/\s{2,}/g, ' ').replace(/^[\s,:;.-]+|[\s,:;.-]+$/g, '').trim();
}

function capital(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Finds a time like 15:00, 15.30, 3pm, 3:15 pm, "at 9" and removes it from the text. */
function takeTime(text: string): { rest: string; time?: string } {
  const re = /\b(?:at\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)\b|\b(?:at\s+)?(\d{1,2})[:.](\d{2})\b|\bat\s+(\d{1,2})\b/i;
  const m = text.match(re);
  if (!m) return { rest: text };
  let h: number;
  let min = 0;
  if (m[3]) {
    h = Number(m[1]) % 12 + (m[3].toLowerCase() === 'pm' ? 12 : 0);
    min = Number(m[2] ?? 0);
  } else if (m[4]) {
    h = Number(m[4]);
    min = Number(m[5]);
  } else {
    h = Number(m[6]);
  }
  if (h > 23 || min > 59) return { rest: text };
  return { rest: text.replace(m[0], ' '), time: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}` };
}

/** Finds today / tomorrow / a weekday / "in 3 days" / 24.12 / 12/24 and returns the date. */
function takeDate(text: string, today: string): { rest: string; date?: string } {
  const lower = text.toLowerCase();
  const simple: Array<[RegExp, number]> = [
    [/\b(today|tonight)\b/i, 0],
    [/\b(tomorrow|tmrw|tmr)\b/i, 1],
    [/\bday after tomorrow\b/i, 2],
  ];
  for (const [re, n] of simple.slice().reverse()) {
    if (re.test(lower)) return { rest: text.replace(re, ' '), date: addDaysToKey(today, n) };
  }
  const inDays = lower.match(/\bin (\d{1,2}) days?\b/);
  if (inDays) return { rest: text.replace(new RegExp(inDays[0], 'i'), ' '), date: addDaysToKey(today, Number(inDays[1])) };
  // a weekday (not "every monday"): the next one, today counts if it's today
  const wd = text.match(/\b(?:on\s+|next\s+|this\s+)?(mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/i);
  if (wd && !/\bevery\b/i.test(text)) {
    const target = DAY_WORDS[wd[1].toLowerCase()];
    const idx = WEEKDAYS.findIndex((w) => w.id === target);
    const todayIdx = WEEKDAYS.findIndex((w) => w.id === weekdayOfDate(today));
    let diff = (idx - todayIdx + 7) % 7;
    if (/\bnext\b/i.test(wd[0]) && diff === 0) diff = 7;
    return { rest: text.replace(wd[0], ' '), date: addDaysToKey(today, diff) };
  }
  // 24.12 / 24/12 (day first) or 2026-12-24
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return { rest: text.replace(iso[0], ' '), date: iso[0] };
  const dm = text.match(/\b(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?\b/);
  // "24.12" or "5/3" is a date; "1.5" (one and a half) is not
  if (dm && (dm[0].includes('/') || dm[3] || (dm[1].length === 2 || dm[2].length === 2))) {
    const d = Number(dm[1]);
    const mo = Number(dm[2]);
    if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12) {
      const year = Number(today.slice(0, 4));
      let date = `${year}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (date < today) date = `${year + 1}${date.slice(4)}`;
      return { rest: text.replace(dm[0], ' '), date };
    }
  }
  return { rest: text };
}

export function parseQuickAdd(raw: string, state: AppState, today: string = todayKey()): Parsed | null {
  const text = raw.trim();
  if (!text) return null;

  // Money: "spent 4.50 on lunch", "paid €12 for cinema", "4.5 lunch", "lunch 4,50€"
  const money = text.match(/^(?:i\s+)?(?:spent|paid|bought|buy|spend)\s+(?:[€$£]\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:€|\$|£|eur|euro|euros|usd|dollars?|gbp|zł|pln)?\s*(?:on|for)?\s*(.*)$/i)
    ?? (() => {
      // "4.5 lunch" / "€12 cinema": a number first only counts as money with a currency or a spending word,
      // so "2 hours homework" or "10 push-ups" stay to-dos.
      const m = text.match(/^([€$£]\s*)?(\d+(?:[.,]\d{1,2})?)\s*(€|\$|£|eur|euro|euros|usd|dollars?|gbp|zł|pln)?\s+(?:on|for)?\s*([a-z].*)$/i);
      if (!m) return null;
      const spendy = CATEGORY_WORDS.some(([, re]) => re.test(m[4])) || /\b(ticket|gift|present|clothes|shoes|book|snacks?)\b/i.test(m[4]);
      return m[1] || m[3] || spendy ? [m[0], m[2], m[4]] : null;
    })()
    ?? (() => {
      const m = text.match(/^([a-z][a-z\s]*?)\s+(?:[€$£]\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:€|\$|£|eur|euro|euros|usd|dollars?)$/i);
      return m ? [m[0], m[2], m[1]] : null;
    })();
  if (money) {
    const amount = Math.round(Number(money[1].replace(',', '.')) * 100);
    if (amount > 0 && amount < 100_000_00) {
      const note = capital(cleanup(money[2] ?? ''));
      const cats = state.money?.categories ?? [];
      const byName = cats.find((c) => note && c.name.toLowerCase().split(/[\s&]+/).some((w) => w.length > 2 && note.toLowerCase().includes(w)));
      const byWord = CATEGORY_WORDS.find(([, re]) => re.test(note))?.[0];
      const categoryId = byName?.id ?? (byWord && cats.some((c) => c.id === byWord) ? byWord : cats.find((c) => c.id === 'other')?.id ?? cats[0]?.id ?? 'other');
      return { kind: 'expense', amount, note, categoryId };
    }
  }

  // A new daily habit: "every day: read", "daily read 10 pages", "habit: stretch"
  const habit = text.match(/^(?:every\s*day|everyday|daily|habit|quest)\s*[:\-–]?\s*(.+)$/i) ?? text.match(/^(.+?)\s+every\s*day$/i);
  if (habit) return { kind: 'quest', title: capital(cleanup(habit[1])) };

  // Weekly: "gym every monday 17:00", "every tue and thu football 18:00"
  if (/\bevery\b/i.test(text)) {
    const days = [...text.matchAll(/\b(mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)s?\b/gi)].map((m) => DAY_WORDS[m[1].toLowerCase()]).filter(Boolean);
    const weekdays = /\bevery\s+(weekday|school day)s?\b/i.test(text) ? (['mon', 'tue', 'wed', 'thu', 'fri'] as WeekdayId[]) : [];
    const weekend = /\bevery\s+weekend\b/i.test(text) ? (['sat', 'sun'] as WeekdayId[]) : [];
    const all = [...new Set([...days, ...weekdays, ...weekend])];
    if (all.length) {
      const { rest, time } = takeTime(text);
      const label = cleanup(
        rest
          .replace(/\bevery\b/gi, ' ')
          .replace(/\b(weekday|school day|weekend)s?\b/gi, ' ')
          .replace(/\b(mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)s?\b/gi, ' ')
          .replace(/\b(and|on)\b/gi, ' '),
      );
      if (label) return { kind: 'weekly', text: capital(label), days: all, time };
    }
  }

  // A dated thing → one-time plan event
  const t = takeTime(text);
  const d = takeDate(t.rest, today);
  if (d.date) {
    const label = cleanup(d.rest.replace(/\b(at|on)\b\s*$/i, ''));
    if (label) return { kind: 'event', text: capital(label), date: d.date, time: t.time };
  }
  if (t.time) {
    const label = cleanup(t.rest);
    if (label) return { kind: 'event', text: capital(label), date: today, time: t.time };
  }

  return { kind: 'task', text: capital(text) };
}
