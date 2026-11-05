import type { Expense, MoneyAccount, MoneyKind, MoneyState, SpendCategory } from './types';
import { addDaysToKey, todayKey } from './date';

export const MONEY_KINDS: Array<{ id: MoneyKind; label: string; short: string; color: string; hint: string }> = [
  { id: 'spending', label: 'Spending money', short: 'Spending', color: '#0891b2', hint: 'Cash, card, wallet. What you can use day to day.' },
  { id: 'savings', label: 'Savings', short: 'Savings', color: '#16a34a', hint: "Put aside for later. Don't spend it." },
  { id: 'investing', label: 'Investments', short: 'Investments', color: '#9333ea', hint: 'Stocks, funds, crypto. Left alone to grow.' },
];

export function kindMeta(kind: MoneyKind) {
  return MONEY_KINDS.find((k) => k.id === kind)!;
}

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'PLN', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK', 'CZK', 'UAH', 'TRY', 'INR', 'NGN', 'ZAR', 'PHP', 'BRL', 'MXN'];

const REGION_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', CZ: 'CZK',
  UA: 'UAH', TR: 'TRY', IN: 'INR', NG: 'NGN', ZA: 'ZAR', PH: 'PHP', BR: 'BRL', MX: 'MXN',
  DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', IE: 'EUR', PT: 'EUR', FI: 'EUR',
  GR: 'EUR', LT: 'EUR', LV: 'EUR', EE: 'EUR', SK: 'EUR', SI: 'EUR', HR: 'EUR', LU: 'EUR', MT: 'EUR', CY: 'EUR',
};

export function guessCurrency(): string {
  try {
    const region = new Intl.Locale(navigator.language).maximize().region;
    return (region && REGION_CURRENCY[region]) || 'USD';
  } catch {
    return 'USD';
  }
}

export const DEFAULT_SPEND_CATEGORIES: SpendCategory[] = [
  { id: 'food', name: 'Food & drinks', icon: '🍔', dailyLimit: 0 },
  { id: 'transport', name: 'Transport', icon: '🚌', dailyLimit: 0 },
  { id: 'fun', name: 'Fun', icon: '🎮', dailyLimit: 0 },
  { id: 'other', name: 'Other', icon: '🛍️', dailyLimit: 0 },
];

/** Default split of a daily limit across the starter categories. */
const DEFAULT_WEIGHTS: Record<string, number> = { food: 50, transport: 20, fun: 20, other: 10 };

export function createEmptyMoney(): MoneyState {
  return { currency: 'USD', setupDone: false, accounts: [], categories: DEFAULT_SPEND_CATEGORIES.map((c) => ({ ...c })), expenses: [] };
}

export function moneyId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function formatMoney(cents: number, currency: string, opts: { compact?: boolean } = {}): string {
  // Compact mode shortens big numbers ($12.5K) and drops ".00" on whole amounts, but never shows "$110.5".
  const useCompact = opts.compact && Math.abs(cents) >= 1000000;
  const whole = cents % 100 === 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      notation: useCompact ? 'compact' : 'standard',
      ...(useCompact
        ? { maximumFractionDigits: 1 }
        : { minimumFractionDigits: opts.compact && whole ? 0 : 2, maximumFractionDigits: opts.compact && whole ? 0 : 2 }),
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

/** "12,50" / "12.5" / "1 200" → cents. Returns null for anything that isn't a non-negative number. */
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[\s ]/g, '').replace(',', '.');
  if (!cleaned || !/^\d*\.?\d{0,2}$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export function centsToInput(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

export function totalByKind(accounts: MoneyAccount[], kind: MoneyKind): number {
  return accounts.filter((a) => a.kind === kind).reduce((s, a) => s + a.amount, 0);
}

export function dailyLimit(categories: SpendCategory[]): number {
  return categories.reduce((s, c) => s + c.dailyLimit, 0);
}

export function expensesOn(expenses: Expense[], date: string): Expense[] {
  return expenses.filter((e) => e.date === date);
}

export function spentOn(expenses: Expense[], date: string, categoryId?: string): number {
  return expensesOn(expenses, date)
    .filter((e) => !categoryId || e.categoryId === categoryId)
    .reduce((s, e) => s + e.amount, 0);
}

export function lastNDays(n: number, today: string = todayKey()): string[] {
  return Array.from({ length: n }, (_, i) => addDaysToKey(today, i - (n - 1)));
}

/** Split a daily total across categories: in proportion to their current limits if any are set, else the default weights. */
export function splitDailyLimit(categories: SpendCategory[], total: number): SpendCategory[] {
  if (categories.length === 0) return categories;
  const useCurrent = dailyLimit(categories) > 0;
  const weights = categories.map((c) => (useCurrent ? c.dailyLimit : (DEFAULT_WEIGHTS[c.id] ?? 10)));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const amounts = weights.map((w) => Math.floor((total * w) / weightSum));
  amounts[0] += total - amounts.reduce((a, b) => a + b, 0);
  return categories.map((c, i) => ({ ...c, dailyLimit: amounts[i] }));
}
