import type { AppState, MoneyState, PlanItem, WeekdayId } from './types';
import { WEEKDAYS, dateOfWeekday, recurringItemsForDay, upcomingEvents } from './weekPlan';
import { todayKey } from './date';
import { billsPerMonth } from './moneyTips';

/**
 * The money plan: from what you get each month and your week plan, how much to save and how much
 * you can spend each day, with more on days you've planned things that cost money (friends,
 * cinema, school lunch, the gym) and less on quiet days.
 */

type Kind = 'fun' | 'food' | 'transport' | 'gift';

const KEYWORDS: Record<Kind, string[]> = {
  fun: ['friend', 'party', 'cinema', 'movie', 'film', 'date', 'mall', 'shopping', 'concert', 'game', 'bowling', 'hang', 'club', 'festival', 'trip', 'fun', 'free time'],
  food: ['lunch', 'dinner', 'restaurant', 'cafe', 'café', 'coffee', 'pizza', 'burger', 'snack', 'eat out', 'breakfast out'],
  transport: ['school', 'work', 'office', 'gym', 'training', 'practice', 'lesson', 'class', 'football', 'basketball', 'tennis', 'swim', 'driving', 'university', 'college', 'job'],
  gift: ['birthday', 'wedding', 'christmas', 'anniversary', 'gift', 'present'],
};

const WEIGHT: Record<Kind, number> = { fun: 1.6, food: 0.6, transport: 0.4, gift: 0 };

export interface DayPlan {
  day: WeekdayId;
  date: string;
  amount: number;
  reasons: Array<{ kind: Kind; text: string }>;
}

export interface MoneyPlan {
  monthlyIn: number;
  saveRate: number;
  saveMonthly: number;
  billsMonthly: number;
  spendWeekly: number;
  days: DayPlan[];
  gifts: Array<{ text: string; date: string }>;
}

function matches(item: PlanItem): Kind[] {
  const t = item.text.toLowerCase();
  return (Object.keys(KEYWORDS) as Kind[]).filter((k) => KEYWORDS[k].some((w) => t.includes(w)));
}

/** A sensible savings rate: young people with an allowance can save more; with a salary, 20% (50/30/20). */
export function suggestedSaveRate(kind: 'allowance' | 'salary'): number {
  return kind === 'allowance' ? 0.3 : 0.2;
}

export function buildMoneyPlan(state: AppState, money: MoneyState): MoneyPlan | null {
  const monthlyIn = money.income?.monthly ?? 0;
  if (monthlyIn <= 0) return null;
  const saveRate = money.saveRate ?? suggestedSaveRate(money.income!.kind);
  const saveMonthly = Math.round(monthlyIn * saveRate);
  const billsMonthly = billsPerMonth(money);
  const spendMonthly = Math.max(0, monthlyIn - saveMonthly - billsMonthly);
  const spendWeekly = Math.round((spendMonthly * 12) / 52);
  const today = todayKey();
  const events = upcomingEvents(state, today);

  const raw = WEEKDAYS.map((w) => {
    const date = dateOfWeekday(w.id, today);
    const items = [...recurringItemsForDay(state, w.id), ...events.filter((e) => e.date === date)];
    const reasons: DayPlan['reasons'] = [];
    let weight = 1;
    for (const it of items) {
      for (const k of matches(it)) {
        if (k === 'gift') continue;
        weight += WEIGHT[k];
        if (!reasons.some((r) => r.text === it.text)) reasons.push({ kind: k, text: it.text });
      }
    }
    return { day: w.id, date, weight, reasons };
  });
  const total = raw.reduce((s, d) => s + d.weight, 0);
  const days = raw.map((d) => ({ day: d.day, date: d.date, reasons: d.reasons, amount: Math.round((spendWeekly * d.weight) / total) }));
  const gifts = events.filter((e) => matches(e).includes('gift')).map((e) => ({ text: e.text, date: e.date! }));
  return { monthlyIn, saveRate, saveMonthly, billsMonthly, spendWeekly, days, gifts };
}
