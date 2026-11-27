/**
 * NOT USED YET. Ready for when the step demo moves into the real Squzo app.
 *
 * Copy to src/lib/nativeSteps.ts. On the website (and in any browser) `nativeSteps` is null, so the
 * current web counting keeps working exactly as before. Inside the phone app it talks to the
 * SquzoSteps plugin from steps-demo/android and steps-demo/ios.
 */
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface StepsStatus {
  available: boolean;
  permission: 'granted' | 'denied' | 'prompt';
  source: 'ios-motion' | 'android-step-counter';
}

export interface StepsDay {
  date: string; // yyyy-mm-dd, phone's local day
  steps: number;
}

interface SquzoStepsPlugin {
  getStatus(): Promise<StepsStatus>;
  requestAccess(): Promise<StepsStatus>;
  getToday(): Promise<StepsDay & { source: StepsStatus['source'] }>;
  getHistory(options: { days: number }): Promise<{ days: StepsDay[] }>;
  startLive(): Promise<void>;
  stopLive(): Promise<void>;
  addListener(event: 'stepsChanged', fn: (day: StepsDay) => void): Promise<PluginListenerHandle>;
}

export const nativeSteps: SquzoStepsPlugin | null = Capacitor.isNativePlatform()
  ? registerPlugin<SquzoStepsPlugin>('SquzoSteps')
  : null;

/*
 * How AutoSteps.tsx would use it (sketch):
 *
 *   useEffect(() => {
 *     if (!nativeSteps || !hasStepsQuest) return;        // website: keep the motion-sensor code
 *     stepCounter.stop();                                 // phone app: the chip is better
 *     const sync = async () => {
 *       const s = await nativeSteps.getStatus();
 *       if (s.permission !== 'granted') return;
 *       const today = await nativeSteps.getToday();
 *       dispatch({ type: 'SYNC_STEPS_TOTAL', steps: today.steps });
 *     };
 *     void sync();
 *     const sub = nativeSteps.addListener('stepsChanged', (d) => dispatch({ type: 'SYNC_STEPS_TOTAL', steps: d.steps }));
 *     void nativeSteps.startLive();
 *     const onShow = () => document.visibilityState === 'visible' && void sync();
 *     document.addEventListener('visibilitychange', onShow);
 *     return () => { void sub.then((h) => h.remove()); void nativeSteps.stopLive(); document.removeEventListener('visibilitychange', onShow); };
 *   }, [hasStepsQuest, dispatch]);
 */
