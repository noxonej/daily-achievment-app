import { useEffect, useState } from 'react';
import { msUntilNextMidnight, msUntilNextWeekStart, formatCountdown } from './date';

export function useDailyResetLabel(): string {
  const [label, setLabel] = useState(() => formatCountdown(msUntilNextMidnight()));
  useEffect(() => {
    const tick = () => setLabel(formatCountdown(msUntilNextMidnight()));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);
  return label;
}

export function useWeeklyResetLabel(): string {
  const [label, setLabel] = useState(() => formatCountdown(msUntilNextWeekStart()));
  useEffect(() => {
    const tick = () => setLabel(formatCountdown(msUntilNextWeekStart()));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);
  return label;
}
