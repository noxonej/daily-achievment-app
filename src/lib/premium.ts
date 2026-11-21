/**
 * Premium features (2026-11-15). Nothing is locked yet: Jonas plans to make the smart coach
 * premium-only later. When payments exist, change `hasPremium` (and nothing else): every premium
 * screen checks `premiumLocked(feature)` and already shows a "Premium" state when it returns true.
 */
export type PremiumFeature = 'coach-chat' | 'create-squad' | 'create-challenge';

/** Features that will need premium once it launches. */
const PREMIUM_ONLY: PremiumFeature[] = ['coach-chat', 'create-squad', 'create-challenge'];

/** Flip to true per feature when premium launches. */
const LOCKED_NOW: Record<PremiumFeature, boolean> = { 'coach-chat': false, 'create-squad': false, 'create-challenge': false };

export function hasPremium(): boolean {
  // TODO when payments exist: read the user's subscription here.
  return false;
}

export function isPremiumFeature(f: PremiumFeature): boolean {
  return PREMIUM_ONLY.includes(f);
}

export function premiumLocked(f: PremiumFeature): boolean {
  return LOCKED_NOW[f] && !hasPremium();
}
