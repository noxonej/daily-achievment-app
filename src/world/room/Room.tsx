import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { DecorSlot, WorldState } from '../../lib/types';
import { DECOR_SLOTS, PROPERTIES, decorFor, type DecorItem } from '../catalog';
import { BEDS, CHAIRS, DESKS, SEATS, TABLES, TECH, type DrawProps } from './furniture';
import { ART, COLLECTIBLES, LAMPS, LIGHTS, PLANTS, POSTERS, RUGS, SHELVES, WINDOWS, type Win } from './decor';
import { mix, shade, tint } from './paint';

/**
 * Your room (2026-11-14 World rebuild): a wide, lit room you look into like a stage set.
 * - Drag sideways to look around; tap anything to walk the camera up to it and change it.
 * - Real time of day: sun through the window by day, warm dusk, and at night the room is lit only
 *   by what you own (lamp, ceiling light, monitors, aquarium, neon...), so better things = nicer light.
 * - Little life: plants sway, clouds drift, screens flicker, fish swim, the cat breathes.
 * - Every item is its own model (src/world/room/furniture.tsx and decor.tsx).
 */
export const ROOM_W = 1200;
export const ROOM_H = 560;

export type TimeOfDay = 'day' | 'dusk' | 'night';

export function timeOfDay(d = new Date()): TimeOfDay {
  const h = d.getHours();
  return h >= 7 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night';
}

export function windowRect(tier: number): Win {
  if (tier >= 6) return { x: 420, y: 46, w: 300, h: 262 };
  const w = 176 + tier * 16;
  const h = 150 + tier * 12;
  return { x: 570 - w / 2, y: 70 - tier * 4, w, h };
}

/** Draw one item of a slot (also used for shop thumbnails). */
export function SlotArt({ item, night, trophies = 0, books = 0, win }: { item: DecorItem; night: boolean; trophies?: number; books?: number; win: Win }) {
  const p: DrawProps = { c: item.color ?? '#8b8f98', a: item.accent ?? shade(item.color ?? '#8b8f98', 0.4), night };
  const m = item.model;
  switch (item.slot) {
    case 'bed':
      return <>{BEDS[m]?.(p)}</>;
    case 'seat':
      return <>{SEATS[m]?.(p)}</>;
    case 'chair':
      return <>{CHAIRS[m]?.(p)}</>;
    case 'desk':
      return <>{DESKS[m]?.(p)}</>;
    case 'tech':
      return <>{TECH[m]?.(p)}</>;
    case 'table':
      return <>{TABLES[m]?.(p)}</>;
    case 'poster':
      return <>{POSTERS[m]?.(p)}</>;
    case 'art':
      return <>{ART[m]?.(p)}</>;
    case 'shelf':
      return <>{SHELVES[m]?.({ ...p, trophies, books })}</>;
    case 'window':
      return <>{WINDOWS[m]?.({ ...p, win })}</>;
    case 'light':
      return <>{LIGHTS[m]?.(p)}</>;
    case 'lamp':
      return <>{LAMPS[m]?.(p)}</>;
    case 'plant':
      return <>{PLANTS[m]?.(p)}</>;
    case 'rug':
      return <>{RUGS[m]?.(p)}</>;
    case 'collectible':
      return <>{COLLECTIBLES[m]?.(p)}</>;
    default:
      return null;
  }
}

/** Shared gradients every room drawing uses. */
export function RoomDefs() {
  return (
    <defs>
      <radialGradient id="rsh">
        <stop offset="0" stopColor="#000" stopOpacity="0.9" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="ledfall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="currentColor" stopOpacity="0.6" />
        <stop offset="1" stopColor="currentColor" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="glow">
        <stop offset="0" stopColor="#fff" stopOpacity="1" />
        <stop offset="0.4" stopColor="#fff" stopOpacity="0.35" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="aoWall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.28" />
      </linearGradient>
      <linearGradient id="aoFloor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0.35" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
        <stop offset="0.55" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.45" />
      </radialGradient>
    </defs>
  );
}

/** Which slots light the room at night, and where the light comes from. */
function lightsFor(get: (s: DecorSlot) => DecorItem, win: Win): Array<{ x: number; y: number; r: number; color: string; o: number }> {
  const out: Array<{ x: number; y: number; r: number; color: string; o: number }> = [];
  const lamp = get('lamp');
  if (lamp.model === 'arc') out.push({ x: 490, y: 240, r: 210, color: '#ffcf8a', o: 0.75 });
  else if (lamp.model === 'tube') out.push({ x: 376, y: 340, r: 170, color: lamp.color ?? '#7cc7ff', o: 0.6 });
  else if (lamp.model !== 'none') out.push({ x: 376, y: 300, r: 190, color: '#ffcf8a', o: 0.75 });
  const light = get('light');
  if (light.model === 'bulb') out.push({ x: 600, y: 110, r: 300, color: '#ffe2a8', o: 0.45 });
  if (light.model === 'pendant') out.push({ x: 600, y: 160, r: 320, color: '#ffe2a8', o: 0.55 });
  if (light.model === 'chandelier') out.push({ x: 600, y: 140, r: 420, color: '#fff1cf', o: 0.7 });
  if (light.model === 'track') [360, 520, 680, 840].forEach((x) => out.push({ x, y: 160, r: 150, color: '#fff1cf', o: 0.45 }));
  if (light.model === 'fairy') [150, 330, 510, 690].forEach((x) => out.push({ x, y: 70, r: 140, color: '#ffd27a', o: 0.4 }));
  if (light.model === 'led') out.push({ x: 600, y: 30, r: 520, color: light.color ?? '#ffb36b', o: 0.35 });
  const tech = get('tech');
  if (tech.model !== 'none' && tech.model !== 'laptop') out.push({ x: 990, y: 295, r: 170, color: '#8fb8ff', o: 0.55 });
  if (tech.model === 'laptop') out.push({ x: 990, y: 315, r: 110, color: '#8fb8ff', o: 0.45 });
  const art = get('art');
  if (art.model === 'neon') out.push({ x: 790, y: 168, r: 120, color: art.color ?? '#7cc7ff', o: 0.6 });
  const col = get('collectible');
  if (col.model === 'aquarium') out.push({ x: 1154, y: 356, r: 120, color: '#67e8f9', o: 0.5 });
  if (col.model === 'arcade') out.push({ x: 1152, y: 330, r: 120, color: '#93c5fd', o: 0.5 });
  const shelf = get('shelf');
  if (shelf.model === 'glass') out.push({ x: 990, y: 150, r: 130, color: '#fff1cf', o: 0.45 });
  const desk = get('desk');
  if (desk.model === 'gaming') out.push({ x: 990, y: 370, r: 140, color: desk.accent ?? '#7cc7ff', o: 0.35 });
  // Moonlight through the window.
  out.push({ x: win.x + win.w / 2, y: win.y + win.h, r: win.w, color: '#9fb4ff', o: 0.18 });
  return out;
}

/* ---------------------------------------------------------------- wall, floor, window */

function Wall({ item }: { item: DecorItem }) {
  const c = item.color ?? '#e9dcc9';
  const m = item.model;
  return (
    <g>
      <rect x={0} y={0} width={ROOM_W} height={400} fill={c} />
      <rect x={0} y={0} width={ROOM_W} height={400} fill="url(#aoWall)" opacity={0.6} />
      {m === 'brick' && (
        <g stroke={mix(c, '#000', 0.28)} strokeWidth={1.2} opacity={0.55}>
          {Array.from({ length: 27 }, (_, r) => (
            <g key={r}>
              <line x1={0} y1={30 + r * 14} x2={ROOM_W} y2={30 + r * 14} />
              {Array.from({ length: 31 }, (_, i) => (
                <line key={i} x1={i * 40 + (r % 2 ? 20 : 0)} y1={30 + r * 14} x2={i * 40 + (r % 2 ? 20 : 0)} y2={44 + r * 14} />
              ))}
            </g>
          ))}
        </g>
      )}
      {m === 'panels' && (
        <g>
          {Array.from({ length: 41 }, (_, i) => (
            <rect key={i} x={i * 30} y={0} width={2} height={400} fill={shade(c, 0.25)} opacity={0.6} />
          ))}
          <rect x={0} y={240} width={ROOM_W} height={6} fill={shade(c, 0.3)} />
        </g>
      )}
      {m === 'concrete' && (
        <g>
          {Array.from({ length: 4 }, (_, r) => (
            <line key={r} x1={0} y1={30 + r * 92} x2={ROOM_W} y2={30 + r * 92} stroke={shade(c, 0.12)} strokeWidth={1} />
          ))}
          {Array.from({ length: 48 }, (_, i) => (
            <circle key={i} cx={(i % 12) * 100 + 50} cy={76 + Math.floor(i / 12) * 92} r={3} fill={shade(c, 0.2)} opacity={0.6} />
          ))}
        </g>
      )}
      {m === 'acoustic' && (
        <g>
          {Array.from({ length: 6 }, (_, r) =>
            Array.from({ length: 24 }, (_, i) => (
              <rect key={`${r}${i}`} x={i * 50 + 2} y={36 + r * 60} width={46} height={56} rx={3} fill={(i + r) % 2 ? tint(c, 0.06) : shade(c, 0.1)} />
            )),
          )}
        </g>
      )}
      {/* ceiling band and crown moulding */}
      <rect x={0} y={0} width={ROOM_W} height={26} fill={shade(c, 0.35)} />
      <rect x={0} y={26} width={ROOM_W} height={4} fill={tint(c, 0.25)} />
      {/* skirting */}
      <rect x={0} y={390} width={ROOM_W} height={12} fill={tint(c, 0.35)} />
      <rect x={0} y={400} width={ROOM_W} height={2} fill={shade(c, 0.3)} />
      {/* corners give depth */}
      <path d="M0 0 L36 26 V402 L0 430 Z" fill={shade(c, 0.22)} />
      <path d={`M${ROOM_W} 0 L${ROOM_W - 36} 26 V402 L${ROOM_W} 430 Z`} fill={shade(c, 0.18)} />
    </g>
  );
}

function Floor({ item }: { item: DecorItem }) {
  const c = item.color ?? '#c9a479';
  const m = item.model;
  const px = (x: number, t: number) => 600 + (x - 600) * (1 + t * 0.45);
  const yAt = (t: number) => 402 + 158 * t;
  return (
    <g>
      <path d={`M36 402 H${ROOM_W - 36} L${ROOM_W} 430 V${ROOM_H} H0 V430 Z`} fill={c} />
      {(m === 'planks' || m === 'herring') && (
        <g stroke={shade(c, 0.22)} strokeWidth={1.3} opacity={0.75}>
          {Array.from({ length: 27 }, (_, i) => {
            const x = -100 + i * 52;
            return <line key={i} x1={x} y1={402} x2={px(x, 1)} y2={ROOM_H} />;
          })}
          {[0.12, 0.27, 0.45, 0.66, 0.9].map((t, r) =>
            Array.from({ length: 26 }, (_, i) => {
              const x = -100 + i * 52 + (r % 2 ? 26 : 0);
              return <line key={`${r}${i}`} x1={px(x, t)} y1={yAt(t)} x2={px(x + 52, t)} y2={yAt(t)} opacity={(i + r) % 3 ? 0.5 : 0} />;
            }),
          )}
        </g>
      )}
      {m === 'herring' &&
        [0.06, 0.2, 0.36, 0.55, 0.78].map((t, r) => (
          <g key={r} stroke={tint(c, 0.12)} strokeWidth={1}>
            {Array.from({ length: 26 }, (_, i) => {
              const x = -100 + i * 52;
              return <line key={i} x1={px(x, t)} y1={yAt(t)} x2={px(x + 26, t + 0.06)} y2={yAt(t + 0.06)} />;
            })}
          </g>
        ))}
      {m === 'tiles' && (
        <g stroke={shade(c, 0.2)} strokeWidth={1.2} opacity={0.7}>
          {Array.from({ length: 17 }, (_, i) => {
            const x = -200 + i * 100;
            return <line key={i} x1={x} y1={402} x2={px(x, 1)} y2={ROOM_H} />;
          })}
          {[0.16, 0.36, 0.6, 0.88].map((t) => (
            <line key={t} x1={0} y1={yAt(t)} x2={ROOM_W} y2={yAt(t)} />
          ))}
        </g>
      )}
      {m === 'carpet' &&
        Array.from({ length: 140 }, (_, i) => <circle key={i} cx={(i * 97) % ROOM_W} cy={410 + ((i * 53) % 150)} r={1.4} fill={tint(c, 0.15)} opacity={0.5} />)}
      {m === 'flat' && <path d={`M36 402 H${ROOM_W - 36} L${ROOM_W} 470 H0 Z`} fill="#fff" opacity={0.06} />}
      {/* soft shadow where floor meets wall */}
      <rect x={0} y={402} width={ROOM_W} height={40} fill="url(#aoFloor)" />
    </g>
  );
}

function WindowView({ view, time, win }: { view: string; time: TimeOfDay; win: Win }) {
  const { x, y, w, h } = win;
  const base = y + h;
  const night = time === 'night';
  const dusk = time === 'dusk';
  const sky = night ? ['#060a1c', '#1c2650'] : dusk ? ['#3b2a63', '#ffb27a'] : ['#6fb6e8', '#d6edff'];
  const far = night ? '#1a2244' : dusk ? '#6b4a6e' : '#9cb7cc';
  const near = night ? '#10162e' : dusk ? '#4a3150' : '#6f8ea8';
  return (
    <g>
      <defs>
        <linearGradient id="winsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill="url(#winsky)" />
      {night && Array.from({ length: 18 }, (_, i) => <circle key={i} cx={x + ((i * 37) % w)} cy={y + ((i * 23) % (h * 0.45))} r={1.1} fill="#fff" opacity={0.8} className={i % 3 ? '' : 'room-twinkle'} />)}
      {time === 'day' && <circle cx={x + w * 0.78} cy={y + h * 0.2} r={14} fill="#fff6d6" />}
      {dusk && <circle cx={x + w * 0.3} cy={y + h * 0.66} r={20} fill="#ffd38a" opacity={0.95} />}
      {night && <circle cx={x + w * 0.74} cy={y + h * 0.2} r={11} fill="#f3f0e0" />}
      {!night && (
        <g className="room-clouds" opacity={dusk ? 0.5 : 0.9}>
          <path d={`M${x + 20} ${y + 44} q10 -14 26 -6 q10 -12 24 0 q14 0 12 10 h-62 Z`} fill="#fff" />
          <path d={`M${x + w * 0.55} ${y + 70} q8 -10 20 -4 q8 -10 18 0 q10 0 9 8 h-47 Z`} fill="#fff" opacity={0.8} />
        </g>
      )}
      {(view === 'sea' || view === 'cliffs') && (
        <g>
          <rect x={x} y={y + h * 0.6} width={w} height={h * 0.4} fill={night ? '#0c1838' : dusk ? '#b2626a' : '#2f86c2'} />
          {[0.68, 0.78, 0.9].map((f) => (
            <line key={f} x1={x + 8} y1={y + h * f} x2={x + w - 8} y2={y + h * f} stroke="#fff" strokeOpacity={0.25} strokeDasharray="14 10" className="room-waves" />
          ))}
          {view === 'cliffs' && <path d={`M${x} ${y + h * 0.5} L${x + w * 0.2} ${y + h * 0.56} L${x + w * 0.28} ${base} H${x} Z`} fill={near} />}
        </g>
      )}
      {(view === 'garden' || view === 'hills' || view === 'park') && (
        <g>
          <path d={`M${x} ${base - h * 0.34} Q${x + w * 0.3} ${base - h * 0.52} ${x + w * 0.6} ${base - h * 0.38} T${x + w} ${base - h * 0.42} V${base} H${x} Z`} fill={night ? '#16241f' : dusk ? '#5d4a4a' : '#86b67e'} />
          <path d={`M${x} ${base - h * 0.16} Q${x + w * 0.5} ${base - h * 0.32} ${x + w} ${base - h * 0.2} V${base} H${x} Z`} fill={night ? '#0f1a16' : dusk ? '#3e3438' : '#5d9459'} />
          {[0.16, 0.42, 0.74].map((f) => (
            <g key={f}>
              <rect x={x + w * f - 2} y={base - h * 0.3} width={4} height={h * 0.14} fill="#5a3e2b" />
              <circle cx={x + w * f} cy={base - h * 0.32} r={view === 'park' ? 14 : 11} fill={night ? '#183025' : '#3f7f45'} />
            </g>
          ))}
        </g>
      )}
      {(view === 'city' || view === 'skyline') &&
        Array.from({ length: 10 }, (_, i) => {
          const bw = w / 10;
          const bh = h * (0.22 + (((i * 53) % 7) / 7) * (view === 'skyline' ? 0.58 : 0.34));
          const bx = x + i * bw;
          return (
            <g key={i}>
              <rect x={bx} y={base - bh} width={bw - 3} height={bh} fill={i % 2 ? far : near} />
              {Array.from({ length: Math.floor(bh / 12) }, (_, r) => (
                <rect key={r} x={bx + 3 + ((r * 5) % Math.max(1, bw - 9))} y={base - bh + 5 + r * 12} width={4} height={5} fill={night ? '#ffd27a' : '#cfe3f3'} opacity={night ? ((r + i) % 3 ? 0.9 : 0.25) : 0.35} />
              ))}
            </g>
          );
        })}
    </g>
  );
}

function WindowFrame({ win, tier }: { win: Win; tier: number }) {
  const { x, y, w, h } = win;
  return (
    <g>
      <rect x={x - 8} y={y - 8} width={w + 16} height={h + 16} rx={4} fill="#000" opacity={0.12} />
      <rect x={x} y={y} width={w} height={h} rx={3} fill="none" stroke="#f6f1ea" strokeWidth={8} />
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke="#f6f1ea" strokeWidth={5} />
      {tier < 6 && <line x1={x} y1={y + h * 0.42} x2={x + w} y2={y + h * 0.42} stroke="#f6f1ea" strokeWidth={4} />}
      {tier < 6 && <rect x={x - 14} y={y + h + 2} width={w + 28} height={8} rx={2} fill="#f6f1ea" />}
      <path d={`M${x + 6} ${y + 6} L${x + w * 0.3} ${y + 6} L${x + 6} ${y + h * 0.5} Z`} fill="#fff" opacity={0.12} />
    </g>
  );
}

/* ---------------------------------------------------------------- the scene */

export interface RoomProps {
  world: WorldState;
  trophies: number;
  books: number;
  /** Slot the camera is looking at (null = whole room). */
  focus: DecorSlot | null;
  onTapSlot?: (slot: DecorSlot) => void;
  /** Show the tap pins on every spot. */
  editing?: boolean;
  /** Slot that just got something new (plays the drop-in). */
  dropped?: { slot: DecorSlot; key: number } | null;
  /** The character, stood on the rug. */
  children?: ReactNode;
  /** Forced time of day (screenshots, previews). */
  time?: TimeOfDay;
}

const ORDER: DecorSlot[] = ['light', 'poster', 'art', 'shelf', 'rug', 'bed', 'lamp', 'seat', 'plant', 'table', 'desk', 'tech', 'chair', 'collectible'];

export function Room({ world, trophies, books, focus, onTapSlot, editing = false, dropped = null, children, time: forced }: RoomProps) {
  const property = PROPERTIES.find((p) => p.id === world.property) ?? PROPERTIES[0];
  const time = forced ?? timeOfDay();
  const night = time === 'night';
  const win = windowRect(property.tier);
  const get = useCallback((s: DecorSlot) => decorFor(world, s), [world]);

  /* camera */
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 360, h: 360 });
  const [pan, setPan] = useState<number | null>(null);
  const drag = useRef<{ x: number; start: number; moved: boolean; v: number; t: number } | null>(null);
  const inertia = useRef(0);
  useLayoutEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const k = size.h / ROOM_H;
  const sceneW = ROOM_W * k;
  const minX = size.w - sceneW;
  const clampX = (x: number) => Math.min(0, Math.max(minX, x));
  const centreX = clampX(size.w / 2 - 600 * k);
  const tx0 = pan ?? centreX;

  let cam = { x: tx0, y: 0, s: 1 };
  if (focus && focus !== 'wall' && focus !== 'floor') {
    const r = DECOR_SLOTS.find((s) => s.id === focus)?.rect;
    if (r) {
      const [x, y, w, h] = r;
      const s = Math.min(2.4, Math.max(1.25, Math.min(size.w / (w * k * 1.35), size.h / (h * k * 1.5))));
      let cx = size.w / 2 - (x + w / 2) * k * s;
      let cy = size.h * 0.45 - (y + h / 2) * k * s;
      cx = Math.min(0, Math.max(size.w - sceneW * s, cx));
      cy = Math.min(0, Math.max(size.h - size.h * s, cy));
      cam = { x: cx, y: cy, s };
    }
  }

  useEffect(() => () => cancelAnimationFrame(inertia.current), []);
  // When the camera zooms back out, keep looking at the same part of the room.
  const lastFocus = useRef(focus);
  useEffect(() => {
    if (lastFocus.current && !focus) {
      const r = DECOR_SLOTS.find((s) => s.id === lastFocus.current)?.rect;
      if (r) setPan(clampX(size.w / 2 - (r[0] + r[2] / 2) * k));
    }
    lastFocus.current = focus;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  const onDown = (e: React.PointerEvent) => {
    if (focus) return;
    cancelAnimationFrame(inertia.current);
    inertia.current = 0;
    drag.current = { x: e.clientX, start: tx0, moved: false, v: 0, t: performance.now() };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    }
    if (d.moved) {
      const now = performance.now();
      const next = clampX(d.start + dx);
      d.v = (next - tx0) / Math.max(1, now - d.t);
      d.t = now;
      setPan(next);
    }
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    // A little glide after you let go.
    let v = d.v * 16;
    let x = tx0;
    const step = () => {
      v *= 0.92;
      x = clampX(x + v);
      setPan(x);
      if (Math.abs(v) > 0.4) inertia.current = requestAnimationFrame(step);
      else inertia.current = 0;
    };
    inertia.current = requestAnimationFrame(step);
    // Swallow the click that ends a drag.
    const swallow = (ev: MouseEvent) => {
      ev.stopPropagation();
      ev.preventDefault();
    };
    window.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 50);
  };

  const lights = night || time === 'dusk' ? lightsFor(get, win) : [];
  const dimmed = (s: DecorSlot) => !!focus && focus !== s && focus !== 'wall' && focus !== 'floor';

  return (
    <div
      ref={viewport}
      className="room-viewport relative w-full h-full overflow-hidden rounded-[28px] select-none"
      style={{ touchAction: focus ? 'auto' : 'pan-y', background: '#0b0d12' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div
        className="room-camera absolute left-0 top-0 origin-top-left"
        style={{
          width: sceneW,
          height: size.h,
          transform: `translate3d(${cam.x}px, ${cam.y}px, 0) scale(${cam.s})`,
          transition: drag.current?.moved || inertia.current ? 'none' : 'transform 0.7s cubic-bezier(.22,.9,.24,1)',
        }}
      >
        <svg viewBox={`0 0 ${ROOM_W} ${ROOM_H}`} width="100%" height="100%" className="block" role="img" aria-label={`Your room in ${property.name}`}>
          <RoomDefs />
          <Wall item={get('wall')} />
          <g clipPath="url(#winclip)">
            <clipPath id="winclip">
              <rect x={win.x} y={win.y} width={win.w} height={win.h} rx={3} />
            </clipPath>
            <WindowView view={property.view} time={time} win={win} />
          </g>
          <WindowFrame win={win} tier={property.tier} />
          {time === 'day' && (
            <path d={`M${win.x} ${win.y + win.h} L${win.x + win.w} ${win.y + win.h} L${win.x + win.w + 140} ${ROOM_H} L${win.x - 60} ${ROOM_H} Z`} fill="#fff4d6" opacity={0.1} />
          )}
          <Floor item={get('floor')} />
          <g className={dimmed('window') ? 'room-dim' : ''}>
            <Placed slot="window" item={get('window')} dropped={dropped}>
              <SlotArt item={get('window')} night={night} win={win} />
            </Placed>
          </g>
          {ORDER.map((s) => (
            <g key={s} className={dimmed(s) ? 'room-dim' : ''}>
              <Placed slot={s} item={get(s)} dropped={dropped}>
                <SlotArt item={get(s)} night={night} trophies={trophies} books={books} win={win} />
              </Placed>
            </g>
          ))}

          {/* lighting: darken the room, then add the light of what you own */}
          {time === 'dusk' && <rect width={ROOM_W} height={ROOM_H} fill="#ff9a5a" opacity={0.1} style={{ mixBlendMode: 'multiply' }} />}
          {night && <rect width={ROOM_W} height={ROOM_H} fill="#0c1230" opacity={0.55} style={{ mixBlendMode: 'multiply' }} />}
          {/* each light is a soft pool in its own colour that fades out smoothly (no visible disc edge) */}
          <defs>
            {lights.map((l, i) => (
              <radialGradient key={i} id={`lg${i}`}>
                {[0, 0.18, 0.4, 0.65, 0.85, 1].map((o, j) => (
                  <stop key={o} offset={o} stopColor={l.color} stopOpacity={[0.62, 0.42, 0.2, 0.07, 0.02, 0][j]} />
                ))}
              </radialGradient>
            ))}
          </defs>
          {lights.map((l, i) => (
            <circle key={i} cx={l.x} cy={l.y} r={l.r * 1.15} fill={`url(#lg${i})`} opacity={l.o * (night ? 0.9 : 0.35)} style={{ mixBlendMode: 'screen' }} pointerEvents="none" />
          ))}
          <rect width={ROOM_W} height={ROOM_H} fill="url(#vignette)" pointerEvents="none" />
        </svg>

        {/* your character, standing on the rug */}
        {children && (
          <div className="absolute pointer-events-none" style={{ left: `${(608 / ROOM_W) * 100}%`, bottom: `${((ROOM_H - 532) / ROOM_H) * 100}%`, width: `${(96 / ROOM_W) * 100}%`, transform: 'translateX(-50%)' }}>
            {children}
          </div>
        )}

        {/* tap targets */}
        {onTapSlot &&
          DECOR_SLOTS.filter((s) => s.id !== 'wall' && s.id !== 'floor').map((s) => {
            const [x, y, w, h] = s.rect;
            const on = focus === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onTapSlot(s.id)}
                aria-label={`Change ${s.label.toLowerCase()}`}
                className={`absolute rounded-xl ${on ? 'room-spot-on' : ''}`}
                style={{ left: `${(x / ROOM_W) * 100}%`, top: `${(y / ROOM_H) * 100}%`, width: `${(w / ROOM_W) * 100}%`, height: `${(h / ROOM_H) * 100}%`, zIndex: s.id === 'rug' || s.id === 'window' || s.id === 'light' ? 0 : 1 }}
              >
                {editing && !focus && (
                  <span className="room-pin absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
                    +
                  </span>
                )}
              </button>
            );
          })}
      </div>

      {/* light from the window sweeps a little over the day */}
      <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/10" />
    </div>
  );
}

/** Wraps an item so a newly placed one drops in with a little bounce and dust. */
function Placed({ slot, item, dropped, children }: { slot: DecorSlot; item: DecorItem; dropped: { slot: DecorSlot; key: number } | null; children: ReactNode }) {
  const fresh = dropped?.slot === slot;
  const r = DECOR_SLOTS.find((s) => s.id === slot)?.rect;
  return (
    <g key={fresh ? `${item.id}-${dropped!.key}` : item.id} className={fresh ? 'room-drop' : ''} style={r ? { transformOrigin: `${r[0] + r[2] / 2}px ${r[1] + r[3]}px` } : undefined}>
      {children}
      {fresh && r && (
        <g className="room-dust" aria-hidden="true">
          {[-1, -0.5, 0, 0.5, 1].map((f, i) => (
            <circle key={i} cx={r[0] + r[2] / 2 + f * r[2] * 0.45} cy={r[1] + r[3] - 6} r={10 + (i % 2) * 5} fill="#fff" opacity={0.5} style={{ animationDelay: `${0.18 + i * 0.03}s`, ['--dx' as string]: `${f * 30}px` }} />
          ))}
        </g>
      )}
    </g>
  );
}
