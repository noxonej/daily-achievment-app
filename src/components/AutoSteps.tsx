import { useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { stepCounter } from '../lib/stepCounter';

/**
 * Counts steps by itself while the app is open, as long as there's a steps quest and the
 * person hasn't paused it. Counted steps are saved every few seconds.
 */
export function AutoSteps() {
  const { state, dispatch } = useApp();
  const hasStepsQuest = state.quests.some((q) => q.measure?.unit === 'steps' && !q.archived);
  const auto = state.prefs?.stepsAuto !== false;

  useEffect(() => {
    if (!hasStepsQuest) return;
    if (auto) stepCounter.auto();
    else stepCounter.stop();
  }, [hasStepsQuest, auto]);

  useEffect(() => {
    if (!hasStepsQuest) return;
    const flush = () => {
      const n = stepCounter.takePending();
      if (n) dispatch({ type: 'ADD_STEPS', steps: n });
    };
    const id = window.setInterval(flush, 3000);
    const onHide = () => document.visibilityState === 'hidden' && flush();
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onHide);
      flush();
    };
  }, [hasStepsQuest, dispatch]);

  return null;
}
