import { describe, expect, it } from 'vitest';
import { kindOf, rarityOf } from './Purchase';
import { GARAGE_SPOTS, PROPERTIES, VEHICLES } from './catalog';
import { dateFormat, weekdayName } from '../lib/locale';

describe('shop reveal (2026-11-25)', () => {
  it('a bigger garage counts as garage, not room decor', () => {
    expect(kindOf(GARAGE_SPOTS[0].id)).toBe('garage');
  });
  it('vehicles keep their own rarity, homes go by tier, the rest by price', () => {
    const v = VEHICLES.find((x) => x.rarity === 'epic')!;
    expect(rarityOf({ id: v.id, name: v.name, coins: 1 })).toBe('epic');
    const top = PROPERTIES.find((p) => p.tier >= 6)!;
    expect(rarityOf({ id: top.id, name: top.name, coins: 1 })).toBe('legendary');
    expect(rarityOf({ id: 'x', name: 'x', coins: 100 })).toBe('common');
    expect(rarityOf({ id: 'x', name: 'x', coins: 1600 })).toBe('epic');
  });
});

describe('cached date formatting', () => {
  it('gives the same text as toLocaleDateString', () => {
    const d = new Date(2026, 10, 25);
    expect(dateFormat({ weekday: 'long', month: 'long', day: 'numeric' }).format(d)).toBe(d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }));
    expect(weekdayName(0, 'short')).toBe(new Date(2024, 0, 1).toLocaleDateString(undefined, { weekday: 'short' }));
    expect(dateFormat({ month: 'short' })).toBe(dateFormat({ month: 'short' }));
  });
});
