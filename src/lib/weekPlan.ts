import type { AppState, PlanItem, WeekdayId } from './types';
import { weekKey } from './date';

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
  return WEEKDAYS.find((w) => w.id === id)?.long ?? id;
}

/** Items for a day, timed ones first in clock order, then untimed ones in the order they were added. */
export function planItemsForDay(state: AppState, day: WeekdayId): PlanItem[] {
  const items = state.weekPlan?.days?.[day] ?? [];
  const timed = items.filter((i) => i.time).sort((a, b) => a.time!.localeCompare(b.time!));
  const untimed = items.filter((i) => !i.time);
  return [...timed, ...untimed];
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
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
