import { useSyncExternalStore } from 'react';

/** Open/closed state for the wardrobe, so the header avatar and the You tab can both open it. */
let open = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const wardrobe = {
  open() {
    open = true;
    emit();
  },
  close() {
    open = false;
    emit();
  },
};

export function useWardrobeOpen(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => open,
  );
}
