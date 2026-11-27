import { HomeShell } from './shells';
import { PetSprite, PoseContext, WalkStepContext, type Pose } from '../../components/PixelAvatar';
import { CharacterSprite, HEADROOM, SPRITE_H, SPRITE_W } from '../char/CharacterSprite';
import type { Base, ClipName } from '../char/anim';
import type { Character } from '../../lib/types';
import { isReduced, remember, restSpots, spotAt, useLife, type RestSpot } from './life';
import { todayKey } from '../../lib/date';
import { L } from '../../lib/lang';
import './life.css';
import { Icon } from '../../components/Icon';
import { usePixelated } from '../px/pixelate';
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { DecorSlot, WorldState } from '../../lib/types';
import { DECOR, DECOR_SLOTS, PROPERTIES, decorFor, type DecorItem } from '../catalog';
import { BEDS, CHAIRS, DESKS, SEATS, TABLES, TECH, type DrawProps } from './furniture';
import { ART, COLLECTIBLES, LAMPS, LIGHTS, PLANTS, POSTERS, RUGS, SHELVES, WINDOWS, type Win } from './decor';
import { mix, shade, tint } from './paint';
import { fullPrefs, t } from '../../lib/prefs';
import { useApp } from '../../store/AppContext';

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
/** The room is shown as pixel art at this size (4 scene units per pixel). */
const PX_W = 400;
const PX_H = Math.round((PX_W * ROOM_H) / ROOM_W);

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
      {(view === 'forest' || view === 'snow') && (
        <g>
          {view === 'snow' && (
            <>
              <path d={`M${x} ${base - h * 0.3} L${x + w * 0.25} ${y + h * 0.3} L${x + w * 0.45} ${base - h * 0.4} L${x + w * 0.7} ${y + h * 0.22} L${x + w} ${base - h * 0.35} V${base} H${x} Z`} fill={night ? '#3b4a6b' : '#c9d6e8'} />
              <path d={`M${x + w * 0.19} ${y + h * 0.4} L${x + w * 0.25} ${y + h * 0.3} L${x + w * 0.31} ${y + h * 0.4} Z M${x + w * 0.63} ${y + h * 0.33} L${x + w * 0.7} ${y + h * 0.22} L${x + w * 0.77} ${y + h * 0.33} Z`} fill="#fff" />
              <rect x={x} y={base - h * 0.14} width={w} height={h * 0.14} fill={night ? '#c7d2e6' : '#f4f7fb'} />
            </>
          )}
          {view === 'forest' && <rect x={x} y={base - h * 0.16} width={w} height={h * 0.16} fill={night ? '#122018' : '#4f7d3f'} />}
          {[0.08, 0.22, 0.38, 0.55, 0.7, 0.86].map((f, i) => {
            const tx = x + w * f;
            const th = h * (0.32 + (i % 3) * 0.08);
            const leaf = night ? '#0f2a1d' : view === 'snow' ? '#2f5d46' : i % 2 ? '#2f6b3a' : '#3d7f45';
            return (
              <g key={f}>
                <rect x={tx - 2} y={base - h * 0.1} width={4} height={h * 0.08} fill="#5a3e2b" />
                <path d={`M${tx} ${base - h * 0.1 - th} L${tx + 16} ${base - h * 0.1} H${tx - 16} Z`} fill={leaf} />
                {view === 'snow' && <path d={`M${tx} ${base - h * 0.1 - th} L${tx + 6} ${base - h * 0.1 - th * 0.62} H${tx - 6} Z`} fill="#fff" />}
              </g>
            );
          })}
        </g>
      )}
      {view === 'beach' && (
        <g>
          <rect x={x} y={y + h * 0.55} width={w} height={h * 0.25} fill={night ? '#0c1838' : dusk ? '#b2626a' : '#38a3d1'} />
          <path d={`M${x} ${base - h * 0.2} Q${x + w * 0.5} ${base - h * 0.28} ${x + w} ${base - h * 0.2} V${base} H${x} Z`} fill={night ? '#8a7a5a' : '#f2d9a0'} />
          <path d={`M${x + w * 0.78} ${base - h * 0.22} Q${x + w * 0.74} ${base - h * 0.45} ${x + w * 0.8} ${base - h * 0.62}`} stroke="#8b5a2b" strokeWidth={5} fill="none" />
          {[-1, -0.4, 0.4, 1].map((d) => (
            <path key={d} d={`M${x + w * 0.8} ${base - h * 0.62} q${d * 22} -6 ${d * 34} 10`} stroke={night ? '#173b26' : '#2f9a4a'} strokeWidth={6} fill="none" strokeLinecap="round" />
          ))}
          <line x1={x + 8} y1={y + h * 0.66} x2={x + w - 8} y2={y + h * 0.66} stroke="#fff" strokeOpacity={0.35} strokeDasharray="14 10" />
        </g>
      )}
      {view === 'jungle' && (
        <g>
          {[0.1, 0.3, 0.5, 0.72, 0.9].map((f, i) => (
            <g key={f}>
              <circle cx={x + w * f} cy={base - h * (0.25 + (i % 2) * 0.12)} r={h * 0.2} fill={night ? '#0e2418' : i % 2 ? '#2e8b47' : '#3fa45a'} />
              <circle cx={x + w * f + 14} cy={base - h * 0.12} r={h * 0.16} fill={night ? '#0b1d13' : '#24703a'} />
            </g>
          ))}
          {!night && (
            <g>
              <circle cx={x + w * 0.62} cy={y + h * 0.42} r={6} fill="#e11d48" />
              <path d={`M${x + w * 0.62} ${y + h * 0.46} l3 12`} stroke="#2563eb" strokeWidth={4} />
              <circle cx={x + w * 0.62 - 3} cy={y + h * 0.415} r={1.4} fill="#111" />
            </g>
          )}
        </g>
      )}
      {view === 'space' && (
        <g>
          <rect x={x} y={y} width={w} height={h} fill="#05060f" />
          {Array.from({ length: 24 }, (_, i) => (
            <circle key={i} cx={x + ((i * 41) % w)} cy={y + ((i * 29) % (h * 0.7))} r={1.1} fill="#fff" opacity={0.85} />
          ))}
          <circle cx={x + w * 0.3} cy={y + h * 0.32} r={h * 0.13} fill="#2f7de1" />
          <path d={`M${x + w * 0.27} ${y + h * 0.24} q10 4 6 12 q-8 2 -10 -4 Z M${x + w * 0.31} ${y + h * 0.34} q8 2 10 8 q-8 4 -12 -2 Z`} fill="#3fae5a" />
          <path d={`M${x} ${base - h * 0.2} Q${x + w * 0.4} ${base - h * 0.3} ${x + w} ${base - h * 0.22} V${base} H${x} Z`} fill="#9a9aa3" />
          {[0.2, 0.55, 0.8].map((f) => (
            <ellipse key={f} cx={x + w * f} cy={base - h * 0.1} rx={12} ry={4} fill="#6b6b74" />
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
  /** Show the walk buttons so you can move your character around the room. */
  walkable?: boolean;
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
  /** Placing an extra shelf/collectible: the next tap in the room says where it goes. */
  placing?: 'shelf' | 'collectible' | null;
  onPlaceAt?: (x: number, y: number) => void;
  /** Tap an extra item you placed. */
  onTapExtra?: (index: number) => void;
  /** Pets that live in your home (the one you take along walks with your character). */
  pets?: Array<{ id: string; name: string }>;
  onTapPet?: (id: string) => void;
  /** Quests finished today: the character cheers once when this went up since your last visit. */
  cheer?: number;
  /** The animated character (2026-11-27). Without it, `children` is shown as a still picture. */
  character?: { look: Partial<Character>; mood?: number };
}

/** The character's width in room units (2026-11-27: 7 units per sprite pixel, was ~4.8). */
export const CHAR_W = 224;
/** Walking and running speed, room units per second (matched to the stride of each loop). */
const WALK_SPEED = 250;
const RUN_SPEED = 440;

const CAMERA_EASE = 'transform 0.7s cubic-bezier(.22,.9,.24,1)';

/** Where pets hang out on the floor (room x), and how far each one wanders. */
const PET_SPOTS = [250, 820, 470, 1010, 140, 700, 380, 930, 560, 1090];

const ORDER: DecorSlot[] = ['light', 'poster', 'art', 'shelf', 'rug', 'bed', 'lamp', 'seat', 'plant', 'table', 'desk', 'tech', 'chair', 'collectible'];

/** A home with nothing in it yet: its walls, window, view, floor and architecture (Homes list + preview). */
export function HomeThumb({ id, className = '' }: { id: string; className?: string }) {
  const property = PROPERTIES.find((p) => p.id === id) ?? PROPERTIES[0];
  const win = windowRect(property.tier);
  const ref = useRef<SVGSVGElement>(null);
  const pixels = usePixelated(ref, `thumb|${id}`, 150, 70);
  const wall = DECOR.find((d) => d.id === property.wall)!;
  const floor = DECOR.find((d) => d.id === property.floor)!;
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <svg ref={ref} viewBox={`0 0 ${ROOM_W} ${ROOM_H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" style={{ opacity: pixels ? 0 : 1 }} aria-hidden="true">
        <RoomDefs />
        <Wall item={wall} />
        <g clipPath={`url(#tclip-${id})`}>
          <clipPath id={`tclip-${id}`}>
            <rect x={win.x} y={win.y} width={win.w} height={win.h} rx={3} />
          </clipPath>
          <WindowView view={property.view} time="day" win={win} />
        </g>
        <WindowFrame win={win} tier={property.tier} />
        <Floor item={floor} />
        <HomeShell id={property.id} />
      </svg>
      {pixels && <img src={pixels} alt="" aria-hidden="true" className="px-art absolute inset-0 w-full h-full object-cover" draggable={false} />}
    </div>
  );
}

export function Room({ walkable = false, world, trophies, books, focus, onTapSlot, editing = false, dropped = null, children, time: forced, placing = null, onPlaceAt, onTapExtra, pets = [], onTapPet, cheer = 0, character }: RoomProps) {
  const time = forced ?? timeOfDay();
  const night = time === 'night';

  /* camera */
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 360, h: 360 });
  const [pan, setPan] = useState<number | null>(null);
  /* walking (2026-11-17): your character can walk left/right and a little forward/back */
  const [pos, setPos] = useState({ x: 608, y: 532 });
  const [facing, setFacing] = useState<1 | -1>(1);
  const [moving, setMoving] = useState(false);
  const [running, setRunning] = useState(false);
  const runRef = useRef(false);
  const [jump, setJump] = useState<{ name: ClipName; key: number } | null>(null);
  const held = useRef<{ dx: number; dy: number; run?: boolean } | null>(null);
  const walkRaf = useRef(0);
  /* daily life (2026-11-24): sit, sleep, small idle moments and reactions (see life.ts) */
  const spots = useMemo(() => restSpots((sl) => decorFor(world, sl)), [world]);
  const [rest, setRest] = useState<RestSpot | null>(() =>
    walkable && night && !remember('session', 'squzo-room-awake') ? spots.find((sp) => sp.kind === 'bed') ?? null : null,
  );
  const [near, setNear] = useState<RestSpot | null>(null);
  // The keyboard handler is set up once, so it reads these through refs (never a stale value).
  const restRef = useRef(rest);
  restRef.current = rest;
  const spotsRef = useRef(spots);
  spotsRef.current = spots;
  const lifeState = rest ? (rest.kind === 'bed' ? 'sleep' : 'sit') : 'stand';
  const { moment, play, poke, tap, clear } = useLife(lifeState, walkable && !focus && !moving, time !== 'day');
  const pose = useMemo<Pose>(() => ({ pose: lifeState, face: moment?.face, blanket: rest?.blanket }), [lifeState, moment?.face, rest?.blanket]);
  // The animation state (see char/anim.ts): a base loop plus one gesture at a time.
  const animBase: Base = lifeState === 'sleep' ? 'sleep' : lifeState === 'sit' ? 'sit' : moving ? (running ? 'run' : 'walk') : 'idle';
  const momentClip = useMemo(() => (moment && moment.kind !== 'none' ? { name: moment.kind as ClipName, key: moment.key } : null), [moment]);
  // A jump or an "admire the new thing" reach wins over an idle moment when it is newer.
  const [admire, setAdmire] = useState<{ name: ClipName; key: number } | null>(null);
  const clip = [momentClip, jump, admire].reduce<{ name: ClipName; key: number } | null>((a, b) => (b && (!a || b.key > a.key) ? b : a), null);
  useEffect(() => {
    if (dropped && walkable) setAdmire({ name: 'reach', key: dropped.key });
  }, [dropped, walkable]);
  // One greeting when the room opens: a cheer after finishing quests, or a morning stretch.
  useEffect(() => {
    if (!walkable) return;
    const day = todayKey();
    const seen = Number(remember('local', `squzo-room-cheer:${day}`) ?? 0);
    let id: ReturnType<typeof setTimeout> | undefined;
    // Remembered only once it really plays (so a re-mount can't swallow it).
    if (cheer > seen && !rest) {
      const n = cheer - seen;
      id = setTimeout(() => {
        remember('local', `squzo-room-cheer:${day}`, String(cheer));
        play({ kind: 'cheer', face: 'starstruck', say: n === 1 ? '+1 quest!' : `+${n} quests!`, ms: 2000 });
      }, 900);
    } else if (time === 'day' && new Date().getHours() < 11 && remember('local', 'squzo-room-morning') !== day && !rest) {
      id = setTimeout(() => {
        remember('local', 'squzo-room-morning', day);
        play({ kind: 'stretch', face: 'sleepy', say: 'Good morning!', ms: 2200 });
      }, 1100);
    }
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function standUp() {
    const r = restRef.current;
    if (!r) return;
    if (r.kind === 'bed') remember('session', 'squzo-room-awake', '1');
    restRef.current = null;
    posRef.current = { x: r.kind === 'bed' ? r.x + 60 : r.x, y: 522 };
    setPos(posRef.current);
    setRest(null);
    setNear(null);
    clear();
    poke();
  }
  function sitDown(sp: RestSpot) {
    setRest(sp);
    setNear(null);
    setFacing(1);
    clear();
    poke();
  }
  // While walking, position and camera are moved straight on the page every frame (no React render,
  // no camera easing), so it stays smooth on a phone (2026-11-18 fix for "walking is very glitchy").
  const posRef = useRef(pos);
  const panRef = useRef<number | null>(null);
  const charRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; start: number; cur: number; moved: boolean; v: number; t: number } | null>(null);
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
  // The walk pad has one fixed side (Settings → Display), and the camera keeps the character a
  // little towards the other side so the pad never covers it (2026-11-27).
  const padSide = fullPrefs(useApp().state.prefs).walkPad ?? 'right';
  const frameAt = walkable ? (padSide === 'right' ? 0.42 : 0.58) : 0.5;
  const centreX = clampX(size.w * frameAt - 600 * k);
  const stickFaded = useRef(false);
  function stickFade(on: boolean) {
    if (stickFaded.current === on) return;
    stickFaded.current = on;
    viewport.current?.querySelectorAll('.room-stick, .room-jump').forEach((el) => el.classList.toggle('room-stick-faded', on));
  }
  /** Is the character (its screen x) close to the pad's corner? */
  const overPad = (sx: number) => (padSide === 'right' ? sx > size.w - 150 : sx < 150);
  // Until you look around, the camera frames the character where it is (e.g. asleep in bed at night).
  const tx0 = pan ?? (rest ? clampX(size.w * frameAt - rest.x * k) : centreX);

  function placeChar() {
    const el = charRef.current;
    if (!el) return;
    const p = posRef.current;
    Object.assign(el.style, charStyle(p, !!character));
  }
  function placeCamera(x: number) {
    const el = cameraRef.current;
    if (!el) return;
    el.style.transition = 'none';
    el.style.transform = `translate3d(${x}px, 0px, 0) scale(1)`;
  }
  /** After moving the camera by hand, let the zoom-to-item glide work again. */
  function releaseCamera() {
    requestAnimationFrame(() => {
      if (cameraRef.current && !held.current && !drag.current && !inertia.current) cameraRef.current.style.transition = CAMERA_EASE;
    });
  }
  function walk(dx: number, dy: number) {
    if (restRef.current) standUp();
    setNear(null);
    held.current = { dx, dy };
    if (dx) setFacing(dx > 0 ? 1 : -1);
    setMoving(true);
    cancelAnimationFrame(walkRaf.current);
    let last = performance.now();
    // The camera glides after the character instead of snapping to it.
    let camX = tx0;
    const step = (t: number) => {
      const h = held.current;
      if (!h) return;
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const p = posRef.current;
      // Push the stick all the way (or hold Shift) to run.
      const run = !!h.run || Math.hypot(h.dx, h.dy) > 0.86;
      if (run !== runRef.current) {
        runRef.current = run;
        setRunning(run);
      }
      const v = run ? RUN_SPEED : WALK_SPEED;
      // Near the room's edge the camera stops, so the character stops short of the pad's corner.
      const padEdge = 118;
      const hiX = padSide === 'right' ? Math.min(1110, (size.w - padEdge - minX) / k) : 1110;
      const loX = padSide === 'left' ? Math.max(90, padEdge / k) : 90;
      const x = Math.min(hiX, Math.max(loX, p.x + h.dx * v * dt));
      const y = Math.min(552, Math.max(500, p.y + h.dy * v * 0.32 * dt));
      posRef.current = { x, y };
      placeChar();
      const target = clampX(size.w * frameAt - x * k);
      // Never let the walk pad sit on top of the character: fade it while they overlap.
      stickFade(overPad(x * k + camX));
      camX += (target - camX) * Math.min(1, dt * 6);
      panRef.current = camX;
      placeCamera(camX);
      walkRaf.current = requestAnimationFrame(step);
    };
    walkRaf.current = requestAnimationFrame(step);
  }
  function stopWalk() {
    held.current = null;
    cancelAnimationFrame(walkRaf.current);
    // Hand the final spot back to React once, so the next render agrees with the page.
    setPos(posRef.current);
    if (panRef.current != null) setPan(panRef.current);
    setMoving(false);
    releaseCamera();
    stickFade(overPad(posRef.current.x * k + (panRef.current ?? tx0)));
    runRef.current = false;
    setRunning(false);
    setNear(spotAt(spotsRef.current, posRef.current.x));
    poke();
  }
  useEffect(() => () => cancelAnimationFrame(walkRaf.current), []);
  useEffect(() => {
    if (!walkable) return;
    const keys: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input,textarea,button,select')) return;
      if (e.key === ' ' && !restRef.current) {
        e.preventDefault();
        if (!e.repeat) setJump({ name: 'jump', key: Date.now() });
        return;
      }
      const d = keys[e.key];
      if (!d) return;
      e.preventDefault();
      if (held.current) {
        held.current.run = e.shiftKey;
        return;
      }
      walk(d[0], d[1]);
      const h = held.current as { dx: number; dy: number; run?: boolean } | null;
      if (h) h.run = e.shiftKey;
    };
    const up = (e: KeyboardEvent) => keys[e.key] && stopWalk();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walkable, size.w, k]);

  let cam = { x: moving && panRef.current != null ? panRef.current : tx0, y: 0, s: 1 };
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
    drag.current = { x: e.clientX, start: tx0, cur: tx0, moved: false, v: 0, t: performance.now() };
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
      // Moved straight on the page, no React render per finger move (2026-11-27).
      const now = performance.now();
      const next = clampX(d.start + dx);
      d.v = (next - d.cur) / Math.max(1, now - d.t);
      d.t = now;
      d.cur = next;
      placeCamera(next);
    }
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    // A little glide after you let go.
    let v = d.v * 16;
    let x = d.cur;
    const step = () => {
      v *= 0.92;
      x = clampX(x + v);
      placeCamera(x);
      if (Math.abs(v) > 0.4) inertia.current = requestAnimationFrame(step);
      else {
        // Hand the final spot to React once.
        inertia.current = 0;
        setPan(x);
        releaseCamera();
      }
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

  const extras = (world.extras ?? []).flatMap((e, i) => {
    const item = DECOR.find((d) => d.id === e.id);
    const r = item && DECOR_SLOTS.find((s) => s.id === item.slot)?.rect;
    return item && r ? [{ ...e, i, item, r }] : [];
  });

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
        ref={cameraRef}
        className="room-camera absolute left-0 top-0 origin-top-left"
        style={{
          width: sceneW,
          height: size.h,
          transform: `translate3d(${cam.x}px, ${cam.y}px, 0) scale(${cam.s})`,
          transition: moving || drag.current?.moved || inertia.current ? 'none' : CAMERA_EASE,
        }}
      >
        <RoomScene world={world} time={time} focus={focus} trophies={trophies} books={books} dropped={dropped} />

        {/* your character: standing on the rug, sitting, or asleep in bed */}
        {(character || children) && (
          <div
            ref={charRef}
            className={`absolute pointer-events-none ${rest ? 'room-rest' : ''}`}
            style={rest ? restStyle(rest, !!character) : charStyle(posRef.current, !!character)}
          >
            {moment?.say && !moving && (
              <span key={moment.key} className="room-bubble-say absolute left-1/2 -translate-x-1/2 -translate-y-full z-[1]" style={{ top: character ? '22%' : '-0.5rem' }} aria-hidden="true">
                {moment.say}
              </span>
            )}
            {lifeState === 'sleep' && !moment?.say && (
              <span className="room-zzz absolute px-label" aria-hidden="true">
                z<span>z</span>
              </span>
            )}
            <div style={{ transform: lifeState === 'sleep' ? 'rotate(-90deg)' : `scaleX(${facing})` }}>
              {character ? (
                <CharacterSprite
                  look={character.look}
                  mood={character.mood}
                  base={animBase}
                  clip={clip}
                  face={moment?.face}
                  blanket={rest?.blanket}
                />
              ) : (
                <div key={moment?.key ?? 'still'} className={moving ? 'room-walk' : moment && !isReduced() ? `room-life-${moment.kind}` : ''}>
                  <PoseContext.Provider value={pose}>
                    <Stepper moving={moving}>{children}</Stepper>
                  </PoseContext.Provider>
                </div>
              )}
            </div>
            {walkable && !moving && !focus && (
              <button
                type="button"
                onClick={tap}
                aria-label={lifeState === 'sleep' ? 'Your character is sleeping' : 'Say hi to your character'}
                className={`room-char-tap absolute pointer-events-auto ${character ? 'room-char-tap-big' : ''}`}
              />
            )}
          </div>
        )}

        {/* sit / sleep / get up */}
        {walkable && !moving && !focus && !placing && (near || rest) && (
          <button
            type="button"
            onClick={() => (rest ? standUp() : near && sitDown(near))}
            className="room-rest-chip absolute pointer-events-auto"
            style={chipStyle(rest ?? near!, !!rest, posRef.current)}
          >
            <Icon name={rest ? (rest.kind === 'bed' ? '☀️' : '⬆') : near!.kind === 'bed' ? '🛏' : '🛋'} size={13} />
            <span className="px-label">{rest ? (rest.kind === 'bed' ? L('Wake up', 'Keltis') : L('Get up', 'Atsistoti')) : near!.kind === 'bed' ? L('Sleep', 'Miegoti') : L('Sit', 'Sėstis')}</span>
          </button>
        )}

        {/* pets that live here: they wander about, tap one to take it along */}
        {!focus &&
          pets.map((p, i) => {
            const x = PET_SPOTS[i % PET_SPOTS.length];
            const y = 520 + ((i * 13) % 30);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onTapPet?.(p.id)}
                aria-label={`${p.name}: take along`}
                className="room-pet absolute"
                style={{ left: `${(x / ROOM_W) * 100}%`, bottom: `${((ROOM_H - y) / ROOM_H) * 100}%`, width: `${(64 / ROOM_W) * 100}%`, zIndex: y, animationDuration: `${9 + (i % 4) * 2.5}s`, animationDelay: `${-i * 1.7}s` }}
              >
                <span className="room-pet-hop block" style={{ animationDelay: `${-i * 0.9}s` }}>
                  <PetSprite itemId={p.id} walking className="block w-full h-auto" />
                </span>
              </button>
            );
          })}

        {/* extra items you placed: tap to move or take away */}
        {onTapExtra &&
          !focus &&
          !placing &&
          extras.map((e) => (
            <button
              key={`t${e.i}`}
              type="button"
              onClick={() => onTapExtra(e.i)}
              aria-label={`Extra ${e.item.name}`}
              className="absolute rounded-xl"
              style={{ left: `${(e.x / ROOM_W) * 100}%`, top: `${(e.y / ROOM_H) * 100}%`, width: `${(e.r[2] / ROOM_W) * 100}%`, height: `${(e.r[3] / ROOM_H) * 100}%`, zIndex: 2 }}
            />
          ))}

        {/* placing an extra: tap where it goes */}
        {placing && onPlaceAt && (
          <button
            type="button"
            aria-label={placing === 'shelf' ? 'Tap the wall to hang it' : 'Tap the floor to put it there'}
            className="absolute inset-0 z-[900] room-place cursor-crosshair"
            onClick={(e) => {
              const b = e.currentTarget.getBoundingClientRect();
              onPlaceAt(((e.clientX - b.left) / b.width) * ROOM_W, ((e.clientY - b.top) / b.height) * ROOM_H);
            }}
          >
            <span className="room-place-zone absolute inset-x-0" style={placing === 'shelf' ? { top: '6%', height: '58%' } : { top: '74%', height: '24%' }} />
          </button>
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
                aria-label={t('world.change', { x: s.label.toLowerCase() })}
                className={`absolute rounded-xl ${on ? 'room-spot-on' : ''}`}
                style={{ left: `${(x / ROOM_W) * 100}%`, top: `${(y / ROOM_H) * 100}%`, width: `${(w / ROOM_W) * 100}%`, height: `${(h / ROOM_H) * 100}%`, zIndex: s.id === 'rug' || s.id === 'window' || s.id === 'light' ? 0 : 1 }}
              >
                {editing && !focus && (
                  // A small icon says what you can change there (was a blank dot, 2026-11-18).
                  <span className="room-pin absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
                    <Icon name={s.icon} size={12} />
                  </span>
                )}
              </button>
            );
          })}
      </div>

      {walkable && character && !focus && !placing && !rest && (
        <button
          type="button"
          className={`room-jump absolute bottom-[112px] z-[5] ${padSide === 'left' ? 'left-[31px]' : 'right-[31px]'}`}
          onPointerDown={(e) => {
            e.stopPropagation();
            setJump({ name: 'jump', key: Date.now() });
          }}
          aria-label={L('Jump', 'Šokti')}
        >
          <span className="px-label">{L('Jump', 'Šok')}</span>
        </button>
      )}
      {walkable && !focus && !placing && (
        <Joystick
          side={padSide}
          onMove={(dx, dy) => {
            if (!dx && !dy) {
              if (held.current) stopWalk();
              return;
            }
            if (!held.current) walk(dx, dy);
            else held.current = { dx, dy };
            if (Math.abs(dx) > 0.25) setFacing(dx > 0 ? 1 : -1);
          }}
          onEnd={stopWalk}
        />
      )}

      {/* light from the window sweeps a little over the day */}
      <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/10" />
    </div>
  );
}


/**
 * The room picture itself (walls, window, furniture, lighting), shown as pixel art. Kept in its own
 * memoised component (2026-11-27) so walking, the walk pad, looking around and the character's
 * animations never re-render the thousands of shapes in it: it only redraws when the room changes.
 */
const RoomScene = memo(function RoomScene({ world, time, focus, trophies, books, dropped }: { world: WorldState; time: TimeOfDay; focus: DecorSlot | null; trophies: number; books: number; dropped: { slot: DecorSlot; key: number } | null }) {
  const property = PROPERTIES.find((p) => p.id === world.property) ?? PROPERTIES[0];
  const night = time === 'night';
  const win = windowRect(property.tier);
  const get = (s: DecorSlot) => decorFor(world, s);
  const lights = night || time === 'dusk' ? lightsFor(get, win) : [];
  const svgRef = useRef<SVGSVGElement>(null);
  const pixels = usePixelated(svgRef, JSON.stringify([world.property, 'shell2', world.decor, world.tints, world.sizes, world.extras, time, focus, trophies, books]), PX_W, PX_H);
  const extras = (world.extras ?? []).flatMap((e, i) => {
    const item = DECOR.find((d) => d.id === e.id);
    const r = item && DECOR_SLOTS.find((s) => s.id === item.slot)?.rect;
    return item && r ? [{ ...e, i, item, r }] : [];
  });
  const dimmed = (s: DecorSlot) => !!focus && focus !== s && focus !== 'wall' && focus !== 'floor';
  return (
    <>
        <svg ref={svgRef} viewBox={`0 0 ${ROOM_W} ${ROOM_H}`} width="100%" height="100%" className="block" style={{ display: pixels ? 'none' : 'block' }} role="img" aria-label={t('world.roomIn', { x: property.name })}>
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
          <HomeShell id={property.id} />
          {extras.filter((e) => e.item.slot === 'shelf').map((e) => (
            <g key={`x${e.i}`} opacity={focus ? 0.35 : 1} transform={`translate(${e.x - e.r[0]} ${e.y - e.r[1]})`}>
              <SlotArt item={e.item} night={night} trophies={trophies} books={books} win={win} />
            </g>
          ))}
          <g opacity={dimmed('window') ? 0.35 : 1}>
            <Placed slot="window" item={get('window')} dropped={dropped}>
              <SlotArt item={get('window')} night={night} win={win} />
            </Placed>
          </g>
          {ORDER.map((s) => (
            <g key={s} opacity={dimmed(s) ? 0.35 : 1}>
              <Placed slot={s} item={get(s)} dropped={dropped}>
                <g transform={sizeTransform(s, world.sizes)}>
                  <SlotArt item={get(s)} night={night} trophies={trophies} books={books} win={win} />
                </g>
              </Placed>
            </g>
          ))}
          {extras.filter((e) => e.item.slot === 'collectible').sort((a, b) => a.y + a.r[3] - (b.y + b.r[3])).map((e) => (
            <g key={`x${e.i}`} opacity={focus ? 0.35 : 1} transform={`translate(${e.x - e.r[0]} ${e.y - e.r[1]})`}>
              <SlotArt item={e.item} night={night} trophies={trophies} books={books} win={win} />
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
        {/* the same scene as pixel art (see px/pixelate.ts) */}
        {pixels && <img src={pixels} alt="" aria-hidden="true" className="px-art absolute inset-0 w-full h-full object-contain pointer-events-none" draggable={false} />}
    </>
  );
});

/** Wraps an item so a newly placed one drops in with a little bounce and dust. */
const SIZE_SCALE = { s: 0.7, m: 1, l: 1.35 } as const;

/** Wall art can hang small, medium or big; it grows from the middle of its spot. */
function sizeTransform(slot: DecorSlot, sizes: WorldState['sizes']): string | undefined {
  if (slot !== 'poster' && slot !== 'art') return undefined;
  const k = SIZE_SCALE[sizes?.[slot] ?? 'm'];
  const r = DECOR_SLOTS.find((x) => x.id === slot)?.rect;
  if (k === 1 || !r) return undefined;
  const cx = r[0] + r[2] / 2;
  const cy = r[1] + r[3] / 2;
  return `translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})`;
}

function Placed({ slot, item, dropped, children }: { slot: DecorSlot; item: DecorItem; dropped: { slot: DecorSlot; key: number } | null; children: ReactNode }) {
  const fresh = dropped?.slot === slot;
  const r = DECOR_SLOTS.find((s) => s.id === slot)?.rect;
  return (
    <g key={fresh ? `${item.id}-${dropped!.key}` : item.id} className={fresh ? 'room-drop' : ''} style={r ? { transformOrigin: `${r[0] + r[2] / 2}px ${r[1] + r[3]}px` } : undefined}>
      {children}
      {fresh && r && (
        <g className="room-dust" aria-hidden="true" data-px-skip="">
          {[-1, -0.5, 0, 0.5, 1].map((f, i) => (
            <circle key={i} cx={r[0] + r[2] / 2 + f * r[2] * 0.45} cy={r[1] + r[3] - 6} r={10 + (i % 2) * 5} fill="#fff" opacity={0.5} style={{ animationDelay: `${0.18 + i * 0.03}s`, ['--dx' as string]: `${f * 30}px` }} />
          ))}
        </g>
      )}
    </g>
  );
}

/** A touch pad: put your thumb down and slide it the way you want to walk (2026-11-17). */
function Joystick({ side, onMove, onEnd }: { side: 'left' | 'right'; onMove: (dx: number, dy: number) => void; onEnd: () => void }) {
  // The knob is moved straight on the page: no React render for every thumb movement (2026-11-27).
  const pad = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLSpanElement>(null);
  const base = useRef<{ x: number; y: number } | null>(null);
  const R = 30;
  const setKnob = (x: number, y: number, on: boolean) => {
    if (knob.current) knob.current.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    pad.current?.classList.toggle('room-stick-on', on);
  };
  const move = (e: React.PointerEvent) => {
    const b = base.current;
    if (!b) return;
    let x = e.clientX - b.x;
    let y = e.clientY - b.y;
    const d = Math.hypot(x, y);
    if (d > R) {
      x = (x / d) * R;
      y = (y / d) * R;
    }
    setKnob(x, y, true);
    // A small dead zone in the middle so a resting thumb doesn't drift.
    if (d < 6) onMove(0, 0);
    else onMove(x / R, y / R);
  };
  const end = () => {
    if (!base.current) return;
    base.current = null;
    setKnob(0, 0, false);
    onEnd();
  };
  return (
    <div
      ref={pad}
      role="slider"
      aria-label={t('world.walk')}
      aria-valuenow={0}
      className={`room-stick absolute bottom-3 z-[5] w-[92px] h-[92px] rounded-full select-none touch-none ${side === 'left' ? 'left-3' : 'right-3'}`}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        const r = e.currentTarget.getBoundingClientRect();
        base.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        move(e);
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        move(e);
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="room-stick-arrows" aria-hidden="true" />
      <span ref={knob} className="room-stick-knob" style={{ transform: 'translate(-50%, -50%)' }} aria-hidden="true" />
    </div>
  );
}

/** Where the character stands: further back is a little smaller. */
/** Sitting: feet on the spot. Lying down: the sprite's centre on the mattress (it's turned on its side). */
function restStyle(r: RestSpot, big = false) {
  const w = (big ? CHAR_W : 172) * r.scale;
  if (big && r.kind === 'bed') {
    // Lying down: the sprite is turned on its side, so its height runs along the mattress.
    const h = (w * SPRITE_H) / SPRITE_W;
    return {
      left: `${(r.x / ROOM_W) * 100}%`,
      bottom: `${((ROOM_H - r.y - h / 2) / ROOM_H) * 100}%`,
      width: `${(w / ROOM_W) * 100}%`,
      transform: 'translateX(-50%)',
      zIndex: '600',
    };
  }
  // Sitting: the sprite's feet are a little above the bottom of its canvas.
  const feet = big ? (w / SPRITE_W) * (SPRITE_H - HEADROOM - 30) : 0;
  const y = r.kind === 'bed' ? r.y + w / 2 : r.y + feet;
  return {
    left: `${(r.x / ROOM_W) * 100}%`,
    bottom: `${((ROOM_H - y) / ROOM_H) * 100}%`,
    width: `${(w / ROOM_W) * 100}%`,
    transform: 'translateX(-50%)',
    zIndex: '600',
  };
}

/** The Sit / Sleep / Get up button floats above the character. */
function chipStyle(r: RestSpot, resting: boolean, p: { x: number; y: number }) {
  const x = resting ? r.x : p.x;
  const top = resting ? (r.kind === 'bed' ? r.y - 130 : r.y - 225) : p.y - 250;
  return { left: `${(x / ROOM_W) * 100}%`, top: `${(Math.max(20, top) / ROOM_H) * 100}%`, transform: 'translate(-50%, -100%)', zIndex: 700 };
}

function charStyle(p: { x: number; y: number }, big = false) {
  const w = (big ? CHAR_W : 172) * (0.92 + ((p.y - 500) / 52) * 0.16);
  // The sprite's feet sit 2 pixels above the bottom of its canvas (the floor shadow is below them).
  const below = big ? (w / SPRITE_W) * (SPRITE_H - HEADROOM - 30) : 0;
  return {
    left: `${(p.x / ROOM_W) * 100}%`,
    bottom: `${((ROOM_H - p.y - below) / ROOM_H) * 100}%`,
    width: `${(w / ROOM_W) * 100}%`,
    transform: 'translateX(-50%)',
    zIndex: String(Math.round(p.y)),
  };
}

/** The walking legs: only this little part re-renders every step, not the whole room. */
function Stepper({ moving, children }: { moving: boolean; children: ReactNode }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!moving) {
      setFrame(0);
      return;
    }
    setFrame(1);
    const id = setInterval(() => setFrame((f) => (f === 1 ? 2 : 1)), 160);
    return () => clearInterval(id);
  }, [moving]);
  return <WalkStepContext.Provider value={frame}>{children}</WalkStepContext.Provider>;
}
