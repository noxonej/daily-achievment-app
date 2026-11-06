import { useSyncExternalStore } from 'react';

export type SettingsPage =
  | 'home'
  | 'profile'
  | 'account'
  | 'appearance'
  | 'language'
  | 'notifications'
  | 'sounds'
  | 'quests'
  | 'data'
  | 'install'
  | 'about';

/** Open/closed state and page for the Settings screen, so the header, You tab and empty states can open it. */
let current: SettingsPage | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const settings = {
  open(page: SettingsPage = 'home') {
    current = page;
    emit();
  },
  close() {
    current = null;
    emit();
  },
};

export function useSettingsPage(): SettingsPage | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}
