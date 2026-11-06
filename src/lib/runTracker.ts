import { useEffect, useState, useSyncExternalStore } from 'react';

/**
 * GPS run tracking. Distance is summed from successive location fixes, skipping inaccurate
 * readings and impossible jumps. Browsers only track while the app is open, so the screen is
 * kept awake during a run where supported.
 */
export type RunStatus = 'idle' | 'running' | 'paused' | 'finished';
export type GpsQuality = 'none' | 'searching' | 'weak' | 'good' | 'denied' | 'unsupported';

export interface RunState {
  open: boolean;
  status: RunStatus;
  /** Time banked before the current running segment. */
  bankedMs: number;
  segmentStart: number | null;
  distanceM: number;
  last: { lat: number; lng: number; t: number } | null;
  gps: GpsQuality;
}

const KEY = 'dayforge-run';
const DEFAULT: RunState = { open: false, status: 'idle', bankedMs: 0, segmentStart: null, distanceM: 0, last: null, gps: 'none' };

function load(): RunState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw), open: false, gps: 'none' } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

let state: RunState = load();
const listeners = new Set<() => void>();
let watchId: number | null = null;
let wakeLock: { release: () => Promise<void> } | null = null;

function set(patch: Partial<RunState>) {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, open: false }));
  } catch {
    // storage unavailable; the run still tracks while the app stays open
  }
  listeners.forEach((l) => l());
}

export function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function onPosition(pos: GeolocationPosition) {
  const { latitude: lat, longitude: lng, accuracy } = pos.coords;
  const t = pos.timestamp || Date.now();
  const quality: GpsQuality = accuracy <= 20 ? 'good' : accuracy <= 40 ? 'weak' : 'searching';
  if (state.status !== 'running') return set({ gps: quality });
  if (accuracy > 40) return set({ gps: quality });
  if (!state.last) return set({ gps: quality, last: { lat, lng, t } });
  const d = haversineM(state.last, { lat, lng });
  const dt = Math.max(1, (t - state.last.t) / 1000);
  if (d < 4) return set({ gps: quality }); // standing still / GPS jitter
  if (d / dt > 10) return set({ gps: quality, last: { lat, lng, t } }); // faster than a sprinter: a GPS jump, don't count it
  set({ gps: quality, distanceM: state.distanceM + d, last: { lat, lng, t } });
}

function startWatch() {
  if (!('geolocation' in navigator)) {
    set({ gps: 'unsupported' });
    return;
  }
  if (watchId !== null) return;
  set({ gps: 'searching' });
  watchId = navigator.geolocation.watchPosition(onPosition, (err) => set({ gps: err.code === err.PERMISSION_DENIED ? 'denied' : 'weak' }), {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 15000,
  });
}

function stopWatch() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = null;
}

async function keepAwake(on: boolean) {
  try {
    if (on && !wakeLock && 'wakeLock' in navigator) {
      wakeLock = await (navigator as unknown as { wakeLock: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock.request('screen');
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {
    wakeLock = null;
  }
}

if (typeof document !== 'undefined') {
  // Wake locks drop when the app is hidden; take it again on return.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.status === 'running') {
      wakeLock = null;
      void keepAwake(true);
    }
  });
}

export const runTracker = {
  open() {
    set({ open: true });
    if (state.status === 'running') startWatch();
    else if ('geolocation' in navigator) startWatch(); // warm up GPS before starting
  },
  close() {
    set({ open: false });
    if (state.status !== 'running') stopWatch();
  },
  start() {
    set({ status: 'running', bankedMs: 0, segmentStart: Date.now(), distanceM: 0, last: null });
    startWatch();
    void keepAwake(true);
  },
  pause() {
    if (state.status !== 'running') return;
    set({ status: 'paused', bankedMs: state.bankedMs + (Date.now() - (state.segmentStart ?? Date.now())), segmentStart: null, last: null });
    void keepAwake(false);
  },
  resume() {
    if (state.status !== 'paused') return;
    set({ status: 'running', segmentStart: Date.now(), last: null });
    startWatch();
    void keepAwake(true);
  },
  finish() {
    if (state.status === 'running') runTracker.pause();
    set({ status: 'finished' });
    stopWatch();
    void keepAwake(false);
  },
  reset() {
    stopWatch();
    void keepAwake(false);
    set({ ...DEFAULT, open: state.open });
  },
  /** Re-attach GPS after the page was reloaded mid-run. */
  resumeAfterReload() {
    if (state.status === 'running') {
      startWatch();
      void keepAwake(true);
    }
  },
};

export function useRunState(): RunState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

export function useElapsedMs(s: RunState): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (s.status !== 'running') return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [s.status]);
  return s.bankedMs + (s.status === 'running' && s.segmentStart ? now - s.segmentStart : 0);
}

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Minutes per km, as m'ss". */
export function formatPace(ms: number, meters: number): string {
  if (meters < 50) return "–'––\"";
  const secPerKm = ms / 1000 / (meters / 1000);
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}'${String(s === 60 ? 59 : s).padStart(2, '0')}"`;
}
