import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computeDerivedStats, graceDays } from './stats';
import { day, stateWith } from '../test/helpers';

// "Today" is Thursday 2026-11-19, midday, for every test here.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 19, 12, 0, 0));
});
afterEach(() => vi.useRealTimers());

const days = (from: string, to: string) => {
  const out: string[] = [];
  for (let d = new Date(`${from}T12:00:00`); d <= new Date(`${to}T12:00:00`); d.setDate(d.getDate() + 1)) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return out;
};

describe('streaks', () => {
  it('is 0 for a new user', () => {
    expect(computeDerivedStats(stateWith([])).currentStreak).toBe(0);
  });

  it('counts days in a row up to today', () => {
    const s = stateWith(days('2026-11-15', '2026-11-19').map((d) => day(d)));
    expect(computeDerivedStats(s).currentStreak).toBe(5);
  });

  it("doesn't break while today is still in progress", () => {
    const s = stateWith(days('2026-11-15', '2026-11-18').map((d) => day(d)));
    expect(computeDerivedStats(s).currentStreak).toBe(4);
  });

  it('forgives one missed day (rest day) without counting it', () => {
    // 13, 14, [15 missed], 16, 17, 18, 19
    const s = stateWith(['2026-11-13', '2026-11-14', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19'].map((d) => day(d)));
    const stats = computeDerivedStats(s);
    expect(stats.graceDates).toEqual(['2026-11-15']);
    expect(stats.currentStreak).toBe(6);
  });

  it('only forgives one missed day in any 7', () => {
    // misses on 14th and 17th (3 days apart): the second one breaks the streak
    const s = stateWith(['2026-11-12', '2026-11-13', '2026-11-15', '2026-11-16', '2026-11-18', '2026-11-19'].map((d) => day(d)));
    expect(computeDerivedStats(s).currentStreak).toBe(2);
  });

  it('two missed days in a row break the streak', () => {
    const s = stateWith(['2026-11-14', '2026-11-15', '2026-11-18', '2026-11-19'].map((d) => day(d)));
    expect(computeDerivedStats(s).currentStreak).toBe(2);
    expect(computeDerivedStats(s).longestStreak).toBe(2);
  });

  it('a Streak Shield day counts like a finished day', () => {
    const s = stateWith(['2026-11-15', '2026-11-16', '2026-11-18', '2026-11-19'].map((d) => day(d)), { shieldedDates: ['2026-11-17'] });
    const stats = computeDerivedStats(s);
    expect(stats.currentStreak).toBe(5);
    expect(stats.graceDates).toEqual([]);
  });

  it('a skipped quest (Skip Pass) keeps the day', () => {
    const log = { ...day('2026-11-19', 1), skipped: ['q0'], xpEarned: 0 };
    const s = stateWith([day('2026-11-18'), log]);
    const stats = computeDerivedStats(s);
    expect(stats.currentStreak).toBe(2);
    expect(stats.totalQuestsCompleted).toBe(1);
  });

  it('longest streak remembers an older, longer run', () => {
    const s = stateWith([...days('2026-10-01', '2026-10-10'), '2026-11-18', '2026-11-19'].map((d) => day(d)));
    const stats = computeDerivedStats(s);
    expect(stats.longestStreak).toBe(10);
    expect(stats.currentStreak).toBe(2);
  });

  it('works across the daylight-saving change (Vilnius, 25 Oct 2026)', () => {
    vi.setSystemTime(new Date(2026, 9, 27, 12));
    const s = stateWith(days('2026-10-22', '2026-10-27').map((d) => day(d)));
    expect(computeDerivedStats(s).currentStreak).toBe(6);
  });

  it('a miss right before today counts as a rest day only once the person is back', () => {
    const logs = Object.fromEntries(['2026-11-16', '2026-11-17'].map((d) => [d, day(d)]));
    // 18th missed, today (19th) still in progress → rest day
    expect([...graceDays(logs, new Set(), '2026-11-19')]).toEqual(['2026-11-18']);
  });
});
