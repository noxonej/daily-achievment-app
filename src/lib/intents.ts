import { useEffect, useState } from 'react';

/** One-shot hand-offs between screens, e.g. the Today "Log spending" button opening the expense form on Money. */
export type Intent = 'add-expense' | 'quests-goals' | 'you-friends';
let pending: Intent | null = null;

export function setIntent(i: Intent) {
  pending = i;
}

export function takeIntent(i: Intent): boolean {
  if (pending !== i) return false;
  pending = null;
  return true;
}

/**
 * For a screen's first state: true if `i` was asked for. It's only cleared once the screen has
 * really appeared, so a render React throws away (while a screen is still loading) can't use it up.
 */
export function useIntent(i: Intent): boolean {
  const [hit] = useState(() => pending === i);
  useEffect(() => {
    if (hit && pending === i) pending = null;
  }, [hit, i]);
  return hit;
}
