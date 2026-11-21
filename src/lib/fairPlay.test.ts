import { describe, expect, it } from 'vitest';
import { daysIntoWeek, plausibleWeekXp, xpToReach } from './fairPlay';

const monday = new Date(2026, 10, 16, 12);
const sunday = new Date(2026, 10, 22, 12);

describe('fair play', () => {
  it('counts week days from Monday', () => {
    expect(daysIntoWeek(monday)).toBe(1);
    expect(daysIntoWeek(sunday)).toBe(7);
  });
  it('xp to reach a level', () => {
    expect(xpToReach(1)).toBe(0);
    expect(xpToReach(2)).toBe(80);
    expect(xpToReach(3)).toBe(190);
  });
  it('allows real weeks', () => {
    expect(plausibleWeekXp(12, 1500, sunday)).toBe(true);
    expect(plausibleWeekXp(40, 9000, sunday)).toBe(true);
    expect(plausibleWeekXp(1, 0, monday)).toBe(true);
  });
  it('hides impossible ones', () => {
    expect(plausibleWeekXp(3, 50000, sunday)).toBe(false); // level 3 can't have 50k this week
    expect(plausibleWeekXp(150, 9000, monday)).toBe(false); // 9,000 on a Monday
    expect(plausibleWeekXp(0, 10, monday)).toBe(false);
    expect(plausibleWeekXp(10, -1, monday)).toBe(false);
  });
});
