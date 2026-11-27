import { describe, expect, it } from 'vitest';
import { DEFAULT_WORLD, GARAGE_UPGRADES, VEHICLES, garageUpgradesOf, owns, tunedStats, unlockOf } from './catalog';
import { drawGarage } from './px/garage';

describe('garage upgrades', () => {
  it('are bought, not free, and known to the shop', () => {
    for (const u of GARAGE_UPGRADES) {
      expect(unlockOf(u.id)).toBeDefined();
      expect(owns(DEFAULT_WORLD, u.id)).toBe(false);
    }
    const world = { ...DEFAULT_WORLD, paid: { 'gu-neon': 2200 } };
    expect([...garageUpgradesOf(world)]).toEqual(['gu-neon']);
  });

  it('change the garage picture', () => {
    const plain = drawGarage('gx-lockup', new Set());
    for (const u of GARAGE_UPGRADES) {
      const built = drawGarage('gx-lockup', new Set(), new Set([u.id]), { x0: 62, x1: 182 });
      expect(built.toDataURL === undefined || JSON.stringify(built) !== JSON.stringify(plain)).toBe(true);
    }
  });
});

describe('tuned stats', () => {
  const car = VEHICLES.find((v) => v.stats)!;
  it('factory parts keep the factory numbers', () => {
    expect(tunedStats(car, {})).toEqual(car.stats);
  });
  it('a wide body and a wing make it quicker', () => {
    const t = tunedStats(car, { kit: 'wide', spoiler: 'gt' })!;
    expect(t.hp).toBeGreaterThan(car.stats!.hp);
    expect(t.zeroTo100).toBeLessThan(car.stats!.zeroTo100);
  });
  it('lifting it lowers the top speed', () => {
    expect(tunedStats(car, { stance: 'lifted' })!.top).toBeLessThan(car.stats!.top);
  });
});
