import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyMoney, dailyLimit, goalProgress, parseMoney, spentOn, splitDailyLimit, centsToInput } from './money';
import { billsPerMonth, futureValue, monthlyCost, nextDue } from './moneyTips';
import { buildMoneyPlan, suggestedSaveRate } from './moneyPlan';
import { reducer, createInitialState } from '../store/reducer';
import type { MoneyState } from './types';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 19, 12)); // Thursday
});
afterEach(() => vi.useRealTimers());

describe('money basics (all amounts in cents)', () => {
  it('parses what people type', () => {
    expect(parseMoney('12,50')).toBe(1250);
    expect(parseMoney('12.5')).toBe(1250);
    expect(parseMoney('1 200')).toBe(120000);
    expect(parseMoney('0.1')).toBe(10);
    expect(parseMoney('-5')).toBeNull();
    expect(parseMoney('abc')).toBeNull();
    expect(parseMoney('1.234')).toBeNull();
    expect(centsToInput(1250)).toBe('12.50');
    expect(centsToInput(1200)).toBe('12');
  });

  it('splits a daily limit across categories without losing cents', () => {
    const cats = splitDailyLimit(createEmptyMoney().categories, 1001);
    expect(dailyLimit(cats)).toBe(1001);
    expect(cats.map((c) => c.dailyLimit)).toEqual([501, 200, 200, 100]);
  });

  it('adds up what was spent on a day', () => {
    const ex = [
      { id: '1', amount: 450, categoryId: 'food', date: '2026-11-19', note: '' },
      { id: '2', amount: 200, categoryId: 'fun', date: '2026-11-19', note: '' },
      { id: '3', amount: 999, categoryId: 'food', date: '2026-11-18', note: '' },
    ];
    expect(spentOn(ex as never, '2026-11-19')).toBe(650);
    expect(spentOn(ex as never, '2026-11-19', 'food')).toBe(450);
  });

  it('works out savings goal progress and weeks left', () => {
    const p = goalProgress(2500, 10000, 1000, new Date(2026, 10, 19));
    expect(p).toMatchObject({ remaining: 7500, pct: 25, reached: false, weeksLeft: 8 });
    expect(goalProgress(10000, 10000, 1000).reached).toBe(true);
    expect(goalProgress(0, 0, undefined).pct).toBe(0);
  });

  it('turns bills into a monthly cost', () => {
    expect(monthlyCost({ amount: 1200, cycle: 'yearly' })).toBe(100);
    expect(monthlyCost({ amount: 1000, cycle: 'weekly' })).toBeCloseTo(4333.33, 1);
    expect(monthlyCost({ amount: 999 })).toBe(999);
    const m = { ...createEmptyMoney(), bills: [{ id: 'a', name: 'Phone', icon: '', amount: 1000, day: 5, kind: 'bill' as const }, { id: 'b', name: 'Music', icon: '', amount: 12000, day: 1, kind: 'subscription' as const, cycle: 'yearly' as const }] };
    expect(billsPerMonth(m)).toBe(2000);
    expect(billsPerMonth(m, 'subscription')).toBe(1000);
  });

  it('finds the next due day, also for short months', () => {
    expect(nextDue(25, '2026-11-19')).toBe('2026-11-25');
    expect(nextDue(5, '2026-11-19')).toBe('2026-12-05');
    expect(nextDue(31, '2027-02-10')).toBe('2027-02-28');
    expect(nextDue(10, '2026-12-20')).toBe('2027-01-10');
  });

  it('compound growth', () => {
    expect(futureValue(10000, 1, 0)).toBe(120000);
    expect(Math.round(futureValue(10000, 10, 7))).toBe(1730848);
  });
});

describe('money plan', () => {
  it('saves 30% of an allowance, 20% of a salary', () => {
    expect(suggestedSaveRate('allowance')).toBe(0.3);
    expect(suggestedSaveRate('salary')).toBe(0.2);
  });

  it('splits the weekly spending over the week, more on days with plans', () => {
    const state = createInitialState();
    const money: MoneyState = { ...createEmptyMoney(), income: { monthly: 10000, kind: 'allowance' } };
    const plan = buildMoneyPlan({ ...state, weekPlan: { ...state.weekPlan, days: { ...state.weekPlan.days, sat: [{ id: 'p', text: 'Cinema with friends', time: '18:00', category: 'social' } as never] } } }, money)!;
    expect(plan.saveMonthly).toBe(3000);
    expect(plan.spendWeekly).toBe(Math.round((7000 * 12) / 52));
    const sat = plan.days.find((d) => d.day === 'sat')!;
    const mon = plan.days.find((d) => d.day === 'mon')!;
    expect(sat.amount).toBeGreaterThan(mon.amount);
    expect(Math.abs(plan.days.reduce((s, d) => s + d.amount, 0) - plan.spendWeekly)).toBeLessThanOrEqual(7);
  });

  it('has no plan without income', () => {
    expect(buildMoneyPlan(createInitialState(), createEmptyMoney())).toBeNull();
  });
});

describe('budget envelopes', () => {
  it('assigns money to a category for the month, and clears it with 0', () => {
    let s = createInitialState();
    s = reducer(s, { type: 'MONEY_SET_ASSIGNED', assigned: { food: 15000, fun: 4999.6 } });
    expect(s.money.categories.find((c) => c.id === 'food')?.monthly).toBe(15000);
    expect(s.money.categories.find((c) => c.id === 'fun')?.monthly).toBe(5000);
    expect(s.money.categories.find((c) => c.id === 'other')?.monthly).toBeUndefined();
    s = reducer(s, { type: 'MONEY_SET_ASSIGNED', assigned: { food: 0 } });
    expect(s.money.categories.find((c) => c.id === 'food')?.monthly).toBeUndefined();
  });
});
