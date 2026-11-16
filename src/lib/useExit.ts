import { useEffect, useState } from 'react';

/**
 * Lets something animate out instead of vanishing. Give it the thing to show (or null). When it
 * becomes null, or changes to something else, the old one stays for `ms` with `leaving` = true (play
 * an exit animation then), and only afterwards is it swapped or removed.
 */
export function useExit<T>(value: T | null | undefined, ms = 260): { shown: T | null; leaving: boolean } {
  const next = value ?? null;
  const [shown, setShown] = useState<T | null>(next);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (next === shown) {
      setLeaving(false);
      return;
    }
    if (shown === null) {
      setShown(next);
      setLeaving(false);
      return;
    }
    setLeaving(true);
    const t = setTimeout(() => {
      setShown(next);
      setLeaving(false);
    }, ms);
    return () => clearTimeout(t);
  }, [next, shown, ms]);
  return { shown, leaving };
}
