import { useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { stepCounter } from '../lib/stepCounter';
import { readInbox } from '../lib/healthSteps';

/**
 * Keeps today's steps up to date by itself:
 * - while the app is open, the motion sensor counts (saved every few seconds);
 * - Apple Health totals sent by the iPhone Shortcut are picked up on open and every 5 minutes;
 * - a link like ?steps=8421 (handy for Shortcuts that open Squzo in Safari) sets today's total.
 */
export function AutoSteps() {
  const { state, dispatch } = useApp();
  const hasStepsQuest = state.quests.some((q) => q.measure?.unit === 'steps' && !q.archived);
  const auto = state.prefs?.stepsAuto !== false;
  const token = state.stepsToken;

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

  // ?steps=8421 in the address: today's total from somewhere else (read once, then removed).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const n = Number(params.get('steps'));
    if (!params.has('steps')) return;
    if (n > 0 && n < 200000) dispatch({ type: 'SYNC_STEPS_TOTAL', steps: n });
    params.delete('steps');
    const rest = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : ''));
  }, [dispatch]);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    const pull = async () => {
      const n = await readInbox(token);
      if (alive && n) dispatch({ type: 'SYNC_STEPS_TOTAL', steps: n });
    };
    void pull();
    const id = window.setInterval(pull, 5 * 60 * 1000);
    const onShow = () => document.visibilityState === 'visible' && void pull();
    document.addEventListener('visibilitychange', onShow);
    return () => {
      alive = false;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onShow);
    };
  }, [token, dispatch]);

  return null;
}
