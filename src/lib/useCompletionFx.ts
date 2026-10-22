import { useEffect, useRef, useState } from 'react';

// True for a short window right after `completed` flips from false to true —
// drives the floating-reward / pop-in effects without needing to store
// anything about "was this just completed" in app state.
export function useCompletionFx(completed: boolean, durationMs = 1000): { justCompleted: boolean } {
  const [justCompleted, setJustCompleted] = useState(false);
  const prevRef = useRef(completed);

  useEffect(() => {
    if (!prevRef.current && completed) {
      setJustCompleted(true);
      const t = setTimeout(() => setJustCompleted(false), durationMs);
      prevRef.current = completed;
      return () => clearTimeout(t);
    }
    prevRef.current = completed;
  }, [completed, durationMs]);

  return { justCompleted };
}
