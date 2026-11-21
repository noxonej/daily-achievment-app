import { describe, expect, it } from 'vitest';
import { cappedXp, DAILY_TYPE_CAP } from './xpCap';

const q = (category: string, title = 'x') => ({ category, title });

describe('daily XP cap per quest type', () => {
  it('leaves normal days alone', () => {
    expect(cappedXp([{ quest: q('Body'), xp: 50 }, { quest: q('Mind'), xp: 90 }])).toEqual({ xp: 140, lost: 0 });
  });
  it('caps one type, not the others', () => {
    const farm = Array.from({ length: 10 }, () => ({ quest: q('Body'), xp: 90 }));
    expect(cappedXp([...farm, { quest: q('Mind'), xp: 30 }])).toEqual({ xp: DAILY_TYPE_CAP + 30, lost: 900 - DAILY_TYPE_CAP });
  });
  it('uses the quest’s own stats first', () => {
    const own = Array.from({ length: 5 }, () => ({ quest: { ...q('Body'), stats: ['wealth' as const] }, xp: 90 }));
    expect(cappedXp([...own, { quest: q('Body'), xp: 90 }]).xp).toBe(DAILY_TYPE_CAP + 90);
  });
});
