import { describe, expect, it } from 'vitest';
import { PLANS, PREMIUM_ON, euro, perMonth, premiumLocked, yearlySaving } from './premium';

describe('premium', () => {
  it('stays off: nothing is locked in a normal build', () => {
    expect(PREMIUM_ON).toBe(false);
    expect(premiumLocked('create-squad')).toBe(false);
    expect(premiumLocked('coach-chat')).toBe(false);
  });
  it('locks premium features only when the switch is on', () => {
    expect(premiumLocked('create-challenge', true)).toBe(true);
  });
  it('prices', () => {
    expect(euro(299)).toBe('€2.99');
    expect(euro(1999)).toBe('€19.99');
    expect(perMonth(PLANS[1])).toBe(167);
    expect(yearlySaving()).toBe(44);
  });
});
