/**
 * Asks the browser to keep Squzo's storage for good.
 *
 * Safari (and other browsers when the phone is low on space) may delete a website's saved data if
 * the site isn't used for a while. "Persistent" storage is exempt from that clean-up. Browsers decide
 * by themselves whether to allow it (an app on the home screen usually gets it).
 */
import { useSyncExternalStore } from 'react';

export type PersistState = 'unknown' | 'persisted' | 'not-persisted' | 'unsupported';

let state: PersistState = 'unknown';
const listeners = new Set<() => void>();
const set = (s: PersistState) => {
  state = s;
  listeners.forEach((l) => l());
};

export async function requestPersistentStorage(): Promise<PersistState> {
  try {
    const sm = typeof navigator !== 'undefined' ? navigator.storage : undefined;
    if (!sm?.persist || !sm.persisted) {
      set('unsupported');
      return state;
    }
    const already = await sm.persisted();
    set(already || (await sm.persist()) ? 'persisted' : 'not-persisted');
  } catch {
    set('unsupported');
  }
  return state;
}

export function usePersistState(): PersistState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}
