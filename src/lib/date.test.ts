import { describe, expect, it } from 'vitest';
import { addDaysToKey, daysBetween, parseKey, todayKey, weekKey } from './date';

describe('date keys', () => {
  it('runs in a time zone with daylight saving (Vilnius)', () => {
    expect(new Date(2026, 0, 15).getTimezoneOffset()).toBe(-120);
    expect(new Date(2026, 6, 15).getTimezoneOffset()).toBe(-180);
  });

  it('formats local dates', () => {
    expect(todayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(todayKey(parseKey('2026-12-31'))).toBe('2026-12-31');
  });

  it('adds days across months and years', () => {
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysToKey('2028-03-01', -1)).toBe('2028-02-29');
    expect(addDaysToKey('2026-11-19', -30)).toBe('2026-10-20');
  });

  it('keeps whole days across daylight-saving changes (Vilnius)', () => {
    // Clocks go forward on 29 Mar 2026 and back on 25 Oct 2026.
    expect(addDaysToKey('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDaysToKey('2026-03-29', 1)).toBe('2026-03-30');
    expect(addDaysToKey('2026-10-24', 1)).toBe('2026-10-25');
    expect(addDaysToKey('2026-10-25', 1)).toBe('2026-10-26');
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });
});

describe('ISO week keys around New Year', () => {
  it.each([
    ['2026-01-01', '2026-W01'], // Thursday: week 1 of 2026
    ['2025-12-29', '2026-W01'], // Monday of that week belongs to 2026
    ['2027-01-01', '2026-W53'], // Friday: 2026 has 53 weeks
    ['2027-01-03', '2026-W53'], // Sunday
    ['2027-01-04', '2027-W01'], // Monday
    ['2024-12-30', '2025-W01'],
    ['2021-01-03', '2020-W53'],
    ['2026-11-19', '2026-W47'],
  ])('%s is in %s', (date, week) => {
    expect(weekKey(parseKey(date))).toBe(week);
  });

  it('every day of a week has the same key, even over a clock change', () => {
    const keys = ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25'].map((d) => weekKey(parseKey(d)));
    expect(new Set(keys).size).toBe(1);
    expect(weekKey(parseKey('2026-10-26'))).not.toBe(keys[0]);
  });
});
