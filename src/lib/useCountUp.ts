import { useEffect, useRef, useState } from 'react';

// Animates a displayed number toward `target` instead of snapping to it,
// so XP gains read as a small payoff rather than a silent tally change.
// Pass `startFrom` (e.g. 0) to also animate on first appearance.
export function useCountUp(target: number, durationMs = 600, startFrom?: number): number {
  const [value, setValue] = useState(startFrom ?? target);
  const fromRef = useRef(startFrom ?? target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) {
      setValue(target);
      return;
    }
    const start = performance.now();

    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs]);

  return value;
}
