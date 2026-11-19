import { describe, expect, it } from 'vitest';
import { appDay, someTabsLocked, tabIsNew, tabUnlocked } from './unlocks';
import { stateWith } from '../test/helpers';

const made = (date: string) => stateWith([], { createdAt: new Date(`${date}T12:00:00`).toISOString() });

describe('Simple mode unlocks', () => {
  it('counts the first day as day 1', () => {
    expect(appDay(made('2026-11-19'), '2026-11-19')).toBe(1);
    expect(appDay(made('2026-11-19'), '2026-11-22')).toBe(4);
  });

  it('opens World on day 2 and Money on day 4', () => {
    const s = made('2026-11-19');
    expect(tabUnlocked(s, 'today', '2026-11-19')).toBe(true);
    expect(tabUnlocked(s, 'quests', '2026-11-19')).toBe(true);
    expect(tabUnlocked(s, 'you', '2026-11-19')).toBe(true);
    expect(tabUnlocked(s, 'world', '2026-11-19')).toBe(false);
    expect(tabUnlocked(s, 'world', '2026-11-20')).toBe(true);
    expect(tabUnlocked(s, 'money', '2026-11-21')).toBe(false);
    expect(tabUnlocked(s, 'money', '2026-11-22')).toBe(true);
    expect(tabUnlocked(s, 'coach', '2026-11-24')).toBe(false);
    expect(tabUnlocked(s, 'coach', '2026-11-25')).toBe(true);
  });

  it('Simple mode off, "show all" or a visit unlocks at once', () => {
    const s = made('2026-11-19');
    expect(tabUnlocked({ ...s, prefs: { ...s.prefs!, simple: false } }, 'money', '2026-11-19')).toBe(true);
    expect(tabUnlocked({ ...s, guide: ['tabs:all'] }, 'money', '2026-11-19')).toBe(true);
    expect(tabUnlocked({ ...s, guide: ['visit:money'] }, 'money', '2026-11-19')).toBe(true);
    expect(someTabsLocked({ ...s, guide: ['tabs:all'] }, '2026-11-19')).toBe(false);
  });

  it('older accounts see everything, with no "New" tags', () => {
    const s = made('2025-01-01');
    expect(tabUnlocked(s, 'money', '2026-11-19')).toBe(true);
    expect(tabIsNew(s, 'money', '2026-11-19')).toBe(false);
  });

  it('a freshly opened tab is "New" until it is visited', () => {
    const s = made('2026-11-19');
    expect(tabIsNew(s, 'world', '2026-11-20')).toBe(true);
    expect(tabIsNew({ ...s, guide: ['visit:world'] }, 'world', '2026-11-20')).toBe(false);
  });
});
