import { useCallback, useEffect, useRef, useState } from 'react';
import type { DecorItem } from '../catalog';

/**
 * Your character's little daily life in the room (2026-11-24).
 *
 * - Rest spots: walk up to the bed, sofa or desk chair and a "Sit" / "Sleep" button appears.
 * - At night the character is already asleep in bed when you open the room; in the morning it
 *   stretches once and says good morning.
 * - Idle moments: if you leave it alone, it does one small thing (waves, looks around, stretches,
 *   yawns) about a minute after you stop, then only every 4–6 minutes. Never two the same in a row.
 * - Tap the character for a quick reaction; after finishing quests it cheers once when you visit.
 *
 * Nothing loops all the time: between moments the only motion is the normal blink. Timers pause
 * while the app is in the background, and with reduced motion only the face changes.
 */

export type RestKind = 'bed' | 'seat' | 'chair';

export interface RestSpot {
  kind: RestKind;
  /** Standing x range (room units) where the button shows. */
  from: number;
  to: number;
  /** Where the character's feet go while sitting, or the centre of the body while lying down. */
  x: number;
  y: number;
  scale: number;
  /** Duvet colour for the bed. */
  blanket?: string;
}

/** Mattress top and pillow left edge for each bed model (from furniture.tsx). */
const BED_GEOM: Record<string, { top: number; pillow: number }> = {
  mattress: { top: 410, pillow: 58 },
  single: { top: 392, pillow: 70 },
  platform: { top: 396, pillow: 58 },
  bunk: { top: 392, pillow: 66 },
  captain: { top: 380, pillow: 92 },
  canopy: { top: 406, pillow: 60 },
  royal: { top: 404, pillow: 84 },
};

export function restSpots(get: (slot: 'bed' | 'seat' | 'chair') => DecorItem | undefined): RestSpot[] {
  const out: RestSpot[] = [];
  const bed = get('bed');
  if (bed && bed.model !== 'none') {
    const g = BED_GEOM[bed.model] ?? BED_GEOM.mattress;
    out.push({ kind: 'bed', from: 90, to: 330, x: g.pillow + 82, y: g.top - 4, scale: 0.92, blanket: bed.color });
  }
  const seat = get('seat');
  if (seat && seat.model !== 'none') {
    const cx = seat.model === 'beanbag' ? 500 : 570;
    out.push({ kind: 'seat', from: cx - 120, to: cx + 120, x: cx, y: seat.model === 'beanbag' ? 458 : 456, scale: 0.84 });
  }
  const chair = get('chair');
  if (chair && chair.model !== 'none') out.push({ kind: 'chair', from: 915, to: 1085, x: 1000, y: 486, scale: 0.86 });
  return out;
}

export function spotAt(spots: RestSpot[], x: number): RestSpot | null {
  return spots.find((s) => x >= s.from && x <= s.to) ?? null;
}

export interface Moment {
  /** CSS animation name suffix (room-life-*). */
  kind: 'wave' | 'look' | 'stretch' | 'hop' | 'yawn' | 'nod' | 'cheer' | 'none';
  face?: string;
  say?: string;
  key: number;
  ms: number;
}

type Life = 'stand' | 'sit' | 'sleep';

const IDLE: Record<Life, Array<Omit<Moment, 'key'>>> = {
  stand: [
    { kind: 'wave', face: 'grin', say: '👋', ms: 1500 },
    { kind: 'look', face: 'sideeye', ms: 2200 },
    { kind: 'stretch', face: 'calm', ms: 1600 },
    { kind: 'hop', face: 'laugh', say: '🎵', ms: 1400 },
  ],
  sit: [
    { kind: 'look', face: 'sideeye', ms: 2200 },
    { kind: 'nod', face: 'calm', ms: 1800 },
    { kind: 'wave', face: 'wink', say: '👋', ms: 1500 },
  ],
  sleep: [],
};

const TAP: Record<Life, Array<Omit<Moment, 'key'>>> = {
  stand: [
    { kind: 'hop', face: 'laugh', say: 'Hehe', ms: 1200 },
    { kind: 'wave', face: 'wink', say: 'Hi!', ms: 1300 },
    { kind: 'hop', face: 'surprised', say: '!', ms: 1000 },
    { kind: 'look', face: 'sideeye', say: '?', ms: 1400 },
  ],
  sit: [
    { kind: 'wave', face: 'wink', say: 'Hi!', ms: 1300 },
    { kind: 'nod', face: 'grin', ms: 1200 },
  ],
  sleep: [{ kind: 'none', face: 'sleepy', say: '5 more min…', ms: 1600 }],
};

export const isReduced = () =>
  typeof document !== 'undefined' && (document.documentElement.dataset.motion === 'reduce' || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

const FIRST_IDLE = [35_000, 60_000];
const LATER_IDLE = [240_000, 360_000];

/**
 * The character's current "moment" (a short gesture with a face), driven by idle time, taps and
 * one-off events. `poke()` resets the idle clock (call it on any interaction).
 */
export function useLife(life: Life, enabled: boolean, nightish: boolean) {
  const [moment, setMoment] = useState<Moment | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = useRef<string>('');
  const count = useRef(0);
  const lifeRef = useRef(life);
  lifeRef.current = life;

  const play = useCallback((m: Omit<Moment, 'key'>) => {
    if (endTimer.current) clearTimeout(endTimer.current);
    last.current = m.kind + (m.face ?? '');
    setMoment({ ...m, key: Date.now() });
    endTimer.current = setTimeout(() => setMoment(null), m.ms);
  }, []);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!enabled || document.hidden) return;
    const [a, b] = count.current === 0 ? FIRST_IDLE : LATER_IDLE;
    timer.current = setTimeout(() => {
      let pool = IDLE[lifeRef.current];
      // A yawn now and then in the evening.
      if (nightish && lifeRef.current !== 'sleep') pool = [...pool, { kind: 'yawn', face: 'sleepy', ms: 1800 }];
      const fresh = pool.filter((m) => m.kind + (m.face ?? '') !== last.current);
      const pick = fresh[Math.floor(Math.random() * fresh.length)];
      count.current++;
      if (pick) play(pick);
      schedule();
    }, a + Math.random() * (b - a));
  }, [enabled, nightish, play]);

  const poke = useCallback(() => {
    count.current = 0;
    schedule();
  }, [schedule]);

  useEffect(() => {
    schedule();
    const vis = () => (document.hidden ? timer.current && clearTimeout(timer.current) : schedule());
    document.addEventListener('visibilitychange', vis);
    return () => {
      document.removeEventListener('visibilitychange', vis);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [schedule]);
  useEffect(() => () => void (endTimer.current && clearTimeout(endTimer.current)), []);

  const tap = useCallback(() => {
    const pool = TAP[lifeRef.current].filter((m) => m.kind + (m.face ?? '') !== last.current);
    play(pool[Math.floor(Math.random() * pool.length)] ?? TAP[lifeRef.current][0]);
    poke();
  }, [play, poke]);

  const clear = useCallback(() => {
    if (endTimer.current) clearTimeout(endTimer.current);
    setMoment(null);
  }, []);

  return { moment, play, poke, tap, clear };
}

/** Small one-per-day/session memories, safely (storage can be blocked). */
export function remember(store: 'local' | 'session', key: string, value?: string): string | null {
  try {
    const s = store === 'local' ? localStorage : sessionStorage;
    if (value === undefined) return s.getItem(key);
    s.setItem(key, value);
    return value;
  } catch {
    return null;
  }
}
