/**
 * Premium (B7, round 2). Everything is behind ONE switch, PREMIUM_ON, and it stays OFF: while it's off
 * nothing is locked and no paywall can open. Turning it on (VITE_PREMIUM=1 at build time) shows the
 * locks and the paywall, but there are still no payments: see docs/PAYMENTS.md for Stripe vs RevenueCat.
 * When payments exist, only `hasPremium` changes.
 */
export type PremiumFeature = 'coach-chat' | 'create-squad' | 'create-challenge';

/** The master switch. Off unless the build sets VITE_PREMIUM=1. */
export const PREMIUM_ON: boolean = import.meta.env.VITE_PREMIUM === '1';

/** Features that need premium once it launches. Everything else stays free forever. */
const PREMIUM_ONLY: PremiumFeature[] = ['coach-chat', 'create-squad', 'create-challenge'];

export interface Plan {
  id: 'monthly' | 'yearly';
  /** Price in euro cents (whole numbers avoid rounding bugs). */
  cents: number;
  months: number;
}
export const PLANS: Plan[] = [
  { id: 'monthly', cents: 299, months: 1 },
  { id: 'yearly', cents: 1999, months: 12 },
];
export const TRIAL_DAYS = 7;

/** "€2.99", "€19.99". */
export function euro(cents: number, lang = 'en'): string {
  return new Intl.NumberFormat(lang === 'lt' ? 'lt-LT' : 'en-IE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

/** Price per month, in cents (yearly: 1999 / 12 = 167). */
export const perMonth = (p: Plan) => Math.round(p.cents / p.months);

/** How much the yearly plan saves against paying monthly, in whole percent (44). */
export function yearlySaving(): number {
  const m = PLANS.find((p) => p.id === 'monthly')!;
  const y = PLANS.find((p) => p.id === 'yearly')!;
  return Math.round((1 - y.cents / (m.cents * 12)) * 100);
}

export function hasPremium(): boolean {
  // When payments exist: read the user's subscription here (see docs/PAYMENTS.md).
  return false;
}

export function isPremiumFeature(f: PremiumFeature): boolean {
  return PREMIUM_ONLY.includes(f);
}

export function premiumLocked(f: PremiumFeature, on = PREMIUM_ON): boolean {
  return on && isPremiumFeature(f) && !hasPremium();
}
