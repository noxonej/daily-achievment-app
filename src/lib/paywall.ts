import { useSyncExternalStore } from 'react';
import type { PremiumFeature } from './premium';

/** Opens the premium screen from anywhere (B7). The screen itself is src/components/Paywall.tsx. */
let open: PremiumFeature | 'browse' | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const paywall = {
  open(f: PremiumFeature | 'browse' = 'browse') {
    open = f;
    emit();
  },
  close() {
    open = null;
    emit();
  },
};

export function usePaywall(): PremiumFeature | 'browse' | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => open,
  );
}
