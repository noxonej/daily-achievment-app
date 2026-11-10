/**
 * A simple pedometer from the phone's motion sensor.
 *
 * A web app cannot read Apple Health or Google Fit, so this counts steps only while the app is open
 * and the screen is on (put the phone in your pocket with the screen awake, or just walk with it).
 * It looks for the bounce of each step in the acceleration: smooth the signal, compare it with a slow
 * moving baseline, and count a step each time it rises clearly above it, at most about 4 per second.
 */
type Listener = () => void;

let running = false;
let pending = 0;
let session = 0;
let smooth = 9.8;
let base = 9.8;
let armed = true;
let lastStep = 0;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

function onMotion(e: DeviceMotionEvent) {
  const a = e.accelerationIncludingGravity;
  if (!a || a.x == null || a.y == null || a.z == null) return;
  const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  smooth = smooth * 0.75 + mag * 0.25;
  base = base * 0.97 + mag * 0.03;
  const diff = smooth - base;
  const now = performance.now();
  if (armed && diff > 1.1 && now - lastStep > 260) {
    armed = false;
    lastStep = now;
    pending++;
    session++;
    emit();
  } else if (diff < 0.2) {
    armed = true;
  }
}

export const stepCounter = {
  supported: () => typeof window !== 'undefined' && 'DeviceMotionEvent' in window,
  isRunning: () => running,
  /** Steps counted this time you switched it on. */
  session: () => session,
  /** Steps counted that are not saved to the quest yet. */
  takePending() {
    const n = pending;
    pending = 0;
    return n;
  },
  async start(): Promise<'ok' | 'denied' | 'unsupported'> {
    if (!stepCounter.supported()) return 'unsupported';
    // iPhone asks for permission first, and only after a tap.
    const DME = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<'granted' | 'denied'> };
    if (typeof DME.requestPermission === 'function') {
      try {
        if ((await DME.requestPermission()) !== 'granted') return 'denied';
      } catch {
        return 'denied';
      }
    }
    if (!running) {
      session = 0;
      smooth = base = 9.8;
      armed = true;
      window.addEventListener('devicemotion', onMotion);
      running = true;
      emit();
    }
    return 'ok';
  },
  stop() {
    if (!running) return;
    window.removeEventListener('devicemotion', onMotion);
    running = false;
    emit();
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};
