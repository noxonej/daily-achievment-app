import type { FocusArea, PlanCategory, PlanItem, WeekdayId } from './types';

type Item = Omit<PlanItem, 'id'>;

export const FOCUS_AREAS: Array<{ id: FocusArea; label: string; icon: string; hint: string }> = [
  { id: 'health', label: 'Health & fitness', icon: '💪', hint: 'Move more, eat better' },
  { id: 'mind', label: 'Calm mind', icon: '🧘', hint: 'Less stress, more focus' },
  { id: 'study', label: 'Study & skills', icon: '📚', hint: 'Learn something every day' },
  { id: 'money', label: 'Money & saving', icon: '💰', hint: 'Spend less, save more' },
  { id: 'work', label: 'Career & side hustle', icon: '🚀', hint: 'Build something that pays' },
  { id: 'sleep', label: 'Better sleep', icon: '🌙', hint: 'Same bedtime, more energy' },
];

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function toTime(min: number): string {
  const m = Math.max(0, Math.min(23 * 60 + 59, Math.round(min / 5) * 5));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

class DayBuilder {
  items: Item[] = [];
  private used = new Set<number>();
  add(min: number, text: string, category: PlanCategory) {
    let t = Math.round(min / 5) * 5;
    while (this.used.has(t)) t += 15; // never two items at the same minute
    this.used.add(t);
    this.items.push({ time: toTime(t), text, category });
  }
  sorted(): Item[] {
    return [...this.items].sort((a, b) => a.time!.localeCompare(b.time!));
  }
}

export interface RoutineInput {
  focusAreas: FocusArea[];
  wakeTime: string;
  bedTime: string;
  /** Weekday school/work hours, or null if there's none. */
  busy: { start: string; end: string } | null;
}

/** Builds a starter Monday–Sunday routine from a few answers. Everything is editable afterwards. */
export function buildRoutine({ focusAreas, wakeTime, bedTime, busy }: RoutineInput): Record<WeekdayId, Item[]> {
  const f = new Set(focusAreas);
  const wake = toMin(wakeTime);
  let bed = toMin(bedTime);
  if (bed <= wake) bed = Math.min(wake + 16 * 60, 23 * 60 + 30);

  function weekday(): Item[] {
    const d = new DayBuilder();
    d.add(wake, 'Wake up + glass of water', 'health');
    if (f.has('mind')) d.add(wake + 15, 'Meditation (10 min)', 'mind');
    d.add(wake + 30, f.has('study') ? 'Breakfast + read 10 pages' : 'Breakfast', f.has('study') ? 'study' : 'health');
    let t: number;
    if (busy) {
      d.add(toMin(busy.start), 'School / work', 'work');
      t = toMin(busy.end) + 30;
    } else {
      t = wake + 90;
      d.add(t, 'Most important task of the day', 'work');
      t += 120;
    }
    if (f.has('study')) {
      d.add(t, 'Study / skill practice (1 hour)', 'study');
      t += 75;
    }
    if (f.has('work')) {
      d.add(t, 'Side project or career skill (45 min)', 'work');
      t += 60;
    }
    if (f.has('health')) {
      d.add(Math.max(t, 17 * 60), 'Workout (45 min)', 'health');
    }
    d.add(Math.max(19 * 60, t), 'Dinner + family / friends', 'personal');
    if (f.has('money')) d.add(bed - 90, "Log today's spending", 'money');
    d.add(bed - 60, f.has('sleep') ? 'Screens off + plan tomorrow' : 'Plan tomorrow', 'mind');
    d.add(bed, 'Sleep', 'health');
    return d.sorted();
  }

  function weekend(kind: 'sat' | 'sun'): Item[] {
    const d = new DayBuilder();
    // A bit of a lie-in, but not so much it wrecks Monday.
    const w = wake + (f.has('sleep') ? 30 : 60);
    d.add(w, 'Wake up + glass of water', 'health');
    if (f.has('mind')) d.add(w + 15, 'Meditation (10 min)', 'mind');
    d.add(w + 30, 'Breakfast', 'health');
    if (kind === 'sat') {
      if (f.has('work') || f.has('money')) d.add(w + 120, 'Side project / money skill (2 hours)', f.has('money') ? 'money' : 'work');
      else if (f.has('study')) d.add(w + 120, 'Learn something new (1 hour)', 'study');
      if (f.has('health')) d.add(13 * 60, 'Long workout or sport', 'health');
      d.add(15 * 60, 'Free time', 'personal');
    } else {
      d.add(w + 90, 'Clean room + laundry', 'personal');
      d.add(12 * 60 + 30, 'Free time', 'personal');
      d.add(19 * 60, 'Weekly review: what worked, what to change', 'mind');
      if (f.has('money')) d.add(19 * 60 + 30, 'Check spending + set a money goal for the week', 'money');
    }
    d.add(kind === 'sat' ? Math.min(bed + 30, 23 * 60 + 30) : bed, 'Sleep', 'health');
    return d.sorted();
  }

  const wd = weekday();
  return { mon: wd, tue: wd, wed: wd, thu: wd, fri: wd, sat: weekend('sat'), sun: weekend('sun') };
}
