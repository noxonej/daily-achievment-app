/**
 * A pedometer from the phone's motion sensor, used while Squzo is open.
 *
 * Why steps "didn't count by themselves" before (2026-11-13 investigation):
 * 1. A website can only read the motion sensor while it is open on screen. Steps walked with the app
 *    closed were never seen. Real all-day steps live in Apple Health / Google's step counter, which a
 *    website cannot read. That part is fixed by Health sync (see healthSteps.ts): an iPhone Shortcut
 *    sends the Health total to Squzo, even when the app is closed.
 * 2. On iPhone the sensor needs permission, and iOS only asks after a tap. The old code asked on start
 *    (no tap), and if iOS answered "denied" for that call it never asked properly again, so the counter
 *    silently stayed off. Now we wait for the first real tap and ask then.
 * 3. A fixed threshold missed gentle steps (phone in hand, slow walk) and counted random shakes. Now the
 *    threshold adapts to how strongly you walk, and steps only count once a walking rhythm is found
 *    (4 regular steps in a row), so picking the phone up doesn't add steps.
 *
 * 2026-11-14 investigation (steps "still" didn't count):
 * 4. The filters were tuned per motion event, assuming 60 events a second. Many phones send fewer
 *    (Low Power Mode, budget Androids: 15–30 a second). At 30 a second the old filter never saw a
 *    step at all (simulated: 0 of 109 steps). The filters now work in real time, so the event rate
 *    doesn't matter (simulated 15, 30, 60 and 100 events a second: within 1%).
 * 5. Random jolts (a bus, putting the phone down) could still count. Now a step only joins the rhythm
 *    if its gap is close to the previous one, and nobody steps faster than 3.3 times a second.
 * 6. Steps counted just before midnight were saved a few seconds later, onto the new day. Pending
 *    steps now remember their day.
 */
type Listener = () => void;
export type StepStatus = 'off' | 'needs-tap' | 'counting' | 'denied' | 'no-sensor';

let status: StepStatus = 'off';
let pending = 0;
let session = 0;
let smooth = 9.8;
let base = 9.8;
let armed = true;
let lastStep = 0;
let lastT = 0;
let peak = 0;
let avgPeak = 2;
let run: number[] = [];
let gotEvent = false;
let sensorTimer = 0;
let tapWaiting = false;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());
const setStatus = (s: StepStatus) => {
  if (status !== s) {
    status = s;
    emit();
  }
};

/** Steps need a rhythm: this many regular steps in a row before any of them count. */
const RHYTHM = 4;
/** Nobody takes more than about 3.3 steps a second, even sprinting. */
const MIN_GAP = 300;

let pendingDay = '';
const dayNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

function commit(n: number) {
  // Steps from before midnight must not land on the new day.
  const day = dayNow();
  if (pendingDay && pendingDay !== day) pending = 0;
  pendingDay = day;
  pending += n;
  session += n;
  emit();
}

function onMotion(e: DeviceMotionEvent) {
  const a = e.accelerationIncludingGravity;
  if (!a || a.x == null || a.y == null || a.z == null) return;
  gotEvent = true;
  const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  const now = performance.now();
  // Filters work in real time, not per event: phones send 20 to 100 motion events a second.
  const dt = Math.min(0.2, Math.max(0.005, lastT ? (now - lastT) / 1000 : 1 / 60));
  lastT = now;
  smooth += (mag - smooth) * (1 - Math.exp(-dt / 0.045));
  base += (mag - base) * (1 - Math.exp(-dt / 0.6));
  const diff = smooth - base;
  // Threshold follows how hard your steps usually are (gentle walkers count too), within sane limits.
  const threshold = Math.min(1.6, Math.max(0.45, avgPeak * 0.45));
  if (armed) {
    if (diff > threshold && now - lastStep > MIN_GAP) {
      armed = false;
      peak = diff;
      const gap = now - lastStep;
      const prevGap = run.length >= 2 ? run[run.length - 1] - run[run.length - 2] : 0;
      lastStep = now;
      // A walking rhythm is steady: a pause, or a gap far off the last one, starts a new rhythm.
      if (gap > 2000 || (prevGap && (gap < prevGap * 0.55 || gap > prevGap * 1.8))) run = [];
      run.push(now);
      if (run.length === RHYTHM) commit(RHYTHM);
      else if (run.length > RHYTHM) commit(1);
    }
  } else {
    peak = Math.max(peak, diff);
    if (diff < threshold * 0.25) {
      armed = true;
      avgPeak = avgPeak * 0.85 + Math.min(peak, 6) * 0.15;
    }
  }
}

function attach() {
  if (status === 'counting') return;
  session = 0;
  smooth = base = 9.8;
  armed = true;
  run = [];
  gotEvent = false;
  window.addEventListener('devicemotion', onMotion);
  setStatus('counting');
  // Some laptops and tablets say they support motion but never send any: stop and say so.
  window.clearTimeout(sensorTimer);
  sensorTimer = window.setTimeout(() => {
    if (status === 'counting' && !gotEvent) {
      window.removeEventListener('devicemotion', onMotion);
      setStatus('no-sensor');
    }
  }, 4000);
}

type DMEWithPermission = { requestPermission?: () => Promise<'granted' | 'denied'> };
const needsPermission = () => typeof (DeviceMotionEvent as unknown as DMEWithPermission).requestPermission === 'function';

export const stepCounter = {
  supported: () => typeof window !== 'undefined' && 'DeviceMotionEvent' in window,
  isRunning: () => status === 'counting',
  status: () => status,
  /** Steps counted since counting was switched on this time. */
  session: () => session,
  /** Steps counted that are not saved to the quest yet. */
  takePending() {
    const n = pendingDay === dayNow() ? pending : 0;
    pending = 0;
    return n;
  },
  /** Start now. On iPhone this must run inside a tap (it shows "Allow motion?" the first time). */
  async start(): Promise<'ok' | 'denied' | 'unsupported'> {
    if (!stepCounter.supported()) {
      setStatus('no-sensor');
      return 'unsupported';
    }
    if (needsPermission()) {
      try {
        if ((await (DeviceMotionEvent as unknown as DMEWithPermission).requestPermission!()) !== 'granted') {
          setStatus('denied');
          return 'denied';
        }
      } catch {
        setStatus('denied');
        return 'denied';
      }
    }
    attach();
    return 'ok';
  },
  stop() {
    window.clearTimeout(sensorTimer);
    window.removeEventListener('devicemotion', onMotion);
    setStatus('off');
  },
  /**
   * Count without a button. Android and most browsers allow it straight away. iPhone only lets a site
   * read motion after a tap, so there we wait for your first tap anywhere in the app and ask then
   * (iPhone shows "Allow motion?" once; after that it's silent).
   */
  auto() {
    if (status === 'counting' || !stepCounter.supported()) return;
    if (!needsPermission()) {
      void stepCounter.start();
      return;
    }
    setStatus('needs-tap');
    if (tapWaiting) return;
    tapWaiting = true;
    const onTap = () => {
      tapWaiting = false;
      document.removeEventListener('touchend', onTap, true);
      document.removeEventListener('click', onTap, true);
      if (status === 'needs-tap') void stepCounter.start();
    };
    // touchend and click both count as a tap for iOS's permission rule; whichever comes first wins.
    document.addEventListener('touchend', onTap, true);
    document.addEventListener('click', onTap, true);
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};
