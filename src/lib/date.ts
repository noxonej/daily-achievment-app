// All date helpers work in the user's local timezone using YYYY-MM-DD keys.

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function daysBetween(aKey: string, bKey: string): number {
  const a = parseKey(aKey);
  const b = parseKey(bKey);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

export function addDaysToKey(key: string, days: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + days);
  return todayKey(d);
}

// ISO 8601 week key, e.g. "2026-W33"
export function weekKey(d: Date = new Date()): string {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayNum = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - dayNum + 3); // Thursday of this week
  const firstThursday = new Date(date.getFullYear(), 0, 4);
  const firstDayNum = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNum + 3);
  const weekNum = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export function formatDisplayDate(key: string): string {
  const d = parseKey(key);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatShortDate(key: string): string {
  const d = parseKey(key);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function msUntilNextMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return next.getTime() - now.getTime();
}

// Weeks reset Monday 00:00 local time, matching weekKey()'s Monday-start weeks.
export function msUntilNextWeekStart(now: Date = new Date()): number {
  const dayNum = (now.getDay() + 6) % 7; // Monday = 0
  const daysAhead = dayNum === 0 ? 7 : 7 - dayNum;
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead, 0, 0, 0, 0);
  return next.getTime() - now.getTime();
}

export function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
