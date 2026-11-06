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
