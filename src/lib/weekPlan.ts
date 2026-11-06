import type { AppState, PlanCategory, PlanItem, WeekdayId } from './types';
import { addDaysToKey, parseKey, todayKey, weekKey } from './date';
import { hour12, locale, weekdayName } from './locale';

export const WEEKDAYS: Array<{ id: WeekdayId; short: string; long: string }> = [
  { id: 'mon', short: 'Mon', long: 'Monday' },
  { id: 'tue', short: 'Tue', long: 'Tuesday' },
  { id: 'wed', short: 'Wed', long: 'Wednesday' },
  { id: 'thu', short: 'Thu', long: 'Thursday' },
  { id: 'fri', short: 'Fri', long: 'Friday' },
  { id: 'sat', short: 'Sat', long: 'Saturday' },
  { id: 'sun', short: 'Sun', long: 'Sunday' },
];

export function todayWeekday(d: Date = new Date()): WeekdayId {
  return WEEKDAYS[(d.getDay() + 6) % 7].id;
}

export function weekdayLabel(id: WeekdayId): string {
  const i = WEEKDAYS.findIndex((w) => w.id === id);
  return i >= 0 ? capitalize(weekdayName(i, 'long')) : id;
}

export function weekdayShort(id: WeekdayId): string {
  const i = WEEKDAYS.findIndex((w) => w.id === id);
  return i >= 0 ? capitalize(weekdayName(i, 'short')).replace(/\.$/, '') : id;
}

function capitalize(s: string): string {
  return s.charAt(0).toLocaleUpperCase(locale()) + s.slice(1);
}

function sortItems(items: PlanItem[]): PlanItem[] {
  const timed = items.filter((i) => i.time).sort((a, b) => a.time!.localeCompare(b.time!));
  const untimed = items.filter((i) => !i.time);
  return [...timed, ...untimed];
}

/** The date ("YYYY-MM-DD") of a weekday in the current Monday–Sunday week. */
export function dateOfWeekday(day: WeekdayId, today: string = todayKey()): string {
  const d = parseKey(today);
  const offset = WEEKDAYS.findIndex((w) => w.id === day) - ((d.getDay() + 6) % 7);
  return addDaysToKey(today, offset);
}

export function weekdayOfDate(date: string): WeekdayId {
  return todayWeekday(parseKey(date));
}

/** The repeating routine for a weekday only (no one-time items). */
export function recurringItemsForDay(state: AppState, day: WeekdayId): PlanItem[] {
  return sortItems(state.weekPlan?.days?.[day] ?? []);
}

/** One-time items that haven't happened yet (today included), soonest first. */
export function upcomingEvents(state: AppState, today: string = todayKey()): PlanItem[] {
  return (state.weekPlan?.events ?? [])
    .filter((e) => e.date && e.date >= today)
    .sort((a, b) => (a.date! === b.date! ? (a.time ?? '99').localeCompare(b.time ?? '99') : a.date!.localeCompare(b.date!)));
}

/**
 * Everything planned for a weekday this week: the routine plus one-time items on that date.
 * Timed ones first in clock order, then untimed ones in the order they were added. Days already
 * over this week don't show their one-time items any more.
 */
export function planItemsForDay(state: AppState, day: WeekdayId): PlanItem[] {
  const date = dateOfWeekday(day);
  const once = date >= todayKey() ? (state.weekPlan?.events ?? []).filter((e) => e.date === date) : [];
  return sortItems([...(state.weekPlan?.days?.[day] ?? []), ...once]);
}

/** "Fri 14 Nov" style label for a one-time item's date, with "Today" / "Tomorrow". */
export function formatEventDate(date: string, today: string = todayKey()): string {
  if (date === today) return 'Today';
  if (date === addDaysToKey(today, 1)) return 'Tomorrow';
  return parseKey(date).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Ids ticked off this week. Last week's ticks are ignored, so every week starts fresh. */
export function checkedPlanIds(state: AppState): Set<string> {
  const plan = state.weekPlan;
  if (!plan || plan.checkedWeekKey !== weekKey()) return new Set();
  return new Set(plan.checkedIds);
}

/** "07:15" → "7:15 AM" or "07:15" depending on the device's clock preference. */
export function formatPlanTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit', hour12: hour12() });
}

export const PLAN_CATEGORIES: Array<{ id: PlanCategory; label: string; dot: string; text: string; bar: string; chip: string }> = [
  { id: 'health', label: 'Health', dot: 'bg-emerald-400', text: 'text-emerald-300', bar: 'bg-emerald-400', chip: 'bg-emerald-500/15 border-emerald-400/60 text-emerald-200' },
  { id: 'mind', label: 'Mind', dot: 'bg-violet-400', text: 'text-violet-300', bar: 'bg-violet-400', chip: 'bg-violet-500/15 border-violet-400/60 text-violet-200' },
  { id: 'study', label: 'Study', dot: 'bg-sky-400', text: 'text-sky-300', bar: 'bg-sky-400', chip: 'bg-sky-500/15 border-sky-400/60 text-sky-200' },
  { id: 'work', label: 'Work', dot: 'bg-orange-400', text: 'text-orange-300', bar: 'bg-orange-400', chip: 'bg-orange-500/15 border-orange-400/60 text-orange-200' },
  { id: 'money', label: 'Money', dot: 'bg-yellow-300', text: 'text-yellow-200', bar: 'bg-yellow-300', chip: 'bg-yellow-400/15 border-yellow-300/60 text-yellow-100' },
  { id: 'personal', label: 'Personal', dot: 'bg-rose-400', text: 'text-rose-300', bar: 'bg-rose-400', chip: 'bg-rose-500/15 border-rose-400/60 text-rose-200' },
];

export function planCategory(id: PlanCategory | undefined) {
  return PLAN_CATEGORIES.find((c) => c.id === id);
}

type StarterItem = Omit<PlanItem, 'id'>;

const WEEKDAY_STARTER: StarterItem[] = [
  { time: '07:00', text: 'Wake up + glass of water', category: 'health' },
  { time: '07:15', text: 'Meditation (10 min)', category: 'mind' },
  { time: '07:30', text: 'Breakfast + read 10 pages', category: 'study' },
  { time: '08:00', text: 'School / work', category: 'work' },
  { time: '16:00', text: 'Skill practice (1 hour)', category: 'study' },
  { time: '17:30', text: 'Workout', category: 'health' },
  { time: '19:00', text: 'Dinner + family / friends', category: 'personal' },
  { time: '21:30', text: 'Plan tomorrow + no screens', category: 'mind' },
  { time: '22:30', text: 'Sleep', category: 'health' },
];

const SATURDAY_STARTER: StarterItem[] = [
  { time: '08:30', text: 'Wake up + glass of water', category: 'health' },
  { time: '08:45', text: 'Meditation (10 min)', category: 'mind' },
  { time: '10:00', text: 'Side project / money skill (2 hours)', category: 'work' },
  { time: '13:00', text: 'Long workout or sport', category: 'health' },
  { time: '15:00', text: 'Free time', category: 'personal' },
  { time: '23:00', text: 'Sleep', category: 'health' },
];

const SUNDAY_STARTER: StarterItem[] = [
  { time: '08:30', text: 'Wake up + glass of water', category: 'health' },
  { time: '08:45', text: 'Meditation (10 min)', category: 'mind' },
  { time: '10:00', text: 'Clean room + laundry', category: 'personal' },
  { time: '12:00', text: 'Free time', category: 'personal' },
  { time: '19:00', text: 'Weekly review: what worked, what to change', category: 'mind' },
  { time: '19:30', text: 'Check spending + set money goal for the week', category: 'work' },
  { time: '22:30', text: 'Sleep', category: 'health' },
];

export const STARTER_ROUTINE: Record<WeekdayId, StarterItem[]> = {
  mon: WEEKDAY_STARTER,
  tue: WEEKDAY_STARTER,
  wed: WEEKDAY_STARTER,
  thu: WEEKDAY_STARTER,
  fri: WEEKDAY_STARTER,
  sat: SATURDAY_STARTER,
  sun: SUNDAY_STARTER,
};
