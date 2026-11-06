import { useEffect, useState, useSyncExternalStore } from 'react';

/** Focus (pomodoro-style) timer. Stored by end timestamp, so it stays correct if the app is closed and reopened. */
export interface FocusState {
  open: boolean;
  label: string;
  durationMin: number;
  /** When running: the moment it ends. */
  endAt: number | null;
  /** When paused: time left. */
  pausedLeftMs: number | null;
  /** Set when a session finishes, until it's acknowledged. */
  finishedAt: number | null;
}

const KEY = 'questlog-focus-timer';
const DEFAULT: FocusState = { open: false, label: '', durationMin: 25, endAt: null, pausedLeftMs: null, finishedAt: null };

function load(): FocusState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw), open: false } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

let state: FocusState = load();
const listeners = new Set<() => void>();

function set(patch: Partial<FocusState>) {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage unavailable; the timer still works while the app stays open
  }
  listeners.forEach((l) => l());
}

let audio: AudioContext | null = null;
function unlockAudio() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!audio && Ctx) audio = new Ctx();
    void audio?.resume();
  } catch {
    audio = null;
  }
}

let soundsOn = true;
export function setSoundsEnabled(on: boolean) {
  soundsOn = on;
}

export function playChime() {
  try {
    if (!audio || !soundsOn) return;
    const now = audio.currentTime;
    [659.25, 783.99, 1046.5].forEach((freq, i) => {
      const o = audio!.createOscillator();
      const g = audio!.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, now + i * 0.16);
      g.gain.exponentialRampToValueAtTime(0.25, now + i * 0.16 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.16 + 0.6);
      o.connect(g).connect(audio!.destination);
      o.start(now + i * 0.16);
      o.stop(now + i * 0.16 + 0.65);
    });
  } catch {
    // sound is a nice-to-have
  }
}

export const focusTimer = {
  open(label?: string) {
    set({ open: true, ...(label !== undefined && !state.endAt && !state.pausedLeftMs ? { label } : {}) });
  },
  close() {
    set({ open: false });
  },
  setDuration(min: number) {
    if (!state.endAt && !state.pausedLeftMs) set({ durationMin: min });
  },
  setLabel(label: string) {
    set({ label });
  },
  start() {
    unlockAudio();
    set({ endAt: Date.now() + state.durationMin * 60000, pausedLeftMs: null, finishedAt: null });
  },
  pause() {
    if (state.endAt) set({ pausedLeftMs: Math.max(0, state.endAt - Date.now()), endAt: null });
  },
  resume() {
    unlockAudio();
    if (state.pausedLeftMs !== null) set({ endAt: Date.now() + state.pausedLeftMs, pausedLeftMs: null });
  },
  /** Stops early; returns whole minutes actually focused. */
  stop(): number {
    const left = state.endAt ? state.endAt - Date.now() : (state.pausedLeftMs ?? state.durationMin * 60000);
    const done = Math.floor((state.durationMin * 60000 - Math.max(0, left)) / 60000);
    set({ endAt: null, pausedLeftMs: null });
    return Math.max(0, done);
  },
  finish() {
    set({ endAt: null, pausedLeftMs: null, finishedAt: Date.now() });
  },
  acknowledge() {
    set({ finishedAt: null });
  },
};

export function useFocusState(): FocusState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

/** Milliseconds left, re-rendering a few times a second while running. */
export function useTimeLeft(s: FocusState): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!s.endAt) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [s.endAt]);
  if (s.endAt) return Math.max(0, s.endAt - now);
  if (s.pausedLeftMs !== null) return s.pausedLeftMs;
  return s.durationMin * 60000;
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
