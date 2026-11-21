import { describe, expect, it } from 'vitest';
import { goalShare, vehicleGoal, wealthPack } from './wealth';
import { questStats } from './irlStats';
import { createEmptyMoney } from './money';

describe('wealth', () => {
  it('the wealth pack is four library quests that feed Wealth', () => {
    const p = wealthPack();
    expect(p).toHaveLength(4);
    p.forEach((q) => expect(questStats(q)[0]).toBe('wealth'));
  });
  it('finds a car fund by icon or name (EN + LT)', () => {
    const m = { ...createEmptyMoney(), accounts: [{ id: 'a', name: 'x', kind: 'savings' as const, amount: 150000 }] };
    const g = (name: string, icon = '🎯') => ({ id: name, name, icon, target: 300000, accountId: 'a', createdAt: '' });
    expect(vehicleGoal({ ...m, goals: [g('Holiday'), g('My first car')] })?.name).toBe('My first car');
    expect(vehicleGoal({ ...m, goals: [g('Mašina')] })?.name).toBe('Mašina');
    expect(vehicleGoal({ ...m, goals: [g('Wheels', '🏍')] })?.name).toBe('Wheels');
    expect(vehicleGoal({ ...m, goals: [g('Laptop')] })).toBeNull();
    expect(goalShare(m, g('car'))).toBe(0.5);
  });
});
