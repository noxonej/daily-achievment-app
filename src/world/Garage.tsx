import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../store/AppContext';
import { useBackToClose } from '../lib/backstack';
import { avatarPixels } from '../components/PixelAvatar';
import { Coin } from '../components/Coin';
import { Icon } from '../components/Icon';
import type { CarMods, DerivedStats, WorldState } from '../lib/types';
import {
  CLASS_LABEL,
  GARAGE_ENVS,
  GARAGE_SPOTS,
  LEGENDARY_BONUS_CAP,
  LEGENDARY_CHEST_CHANCE,
  PAINTS,
  PARTS,
  RARITY_COLOR,
  TROPHIES,
  VEHICLES,
  canFit,
  canUnlock,
  garageEnvOf,
  GARAGE_UPGRADES,
  garageUpgradesOf,
  tunedStats,
  garageSpots,
  garageUsed,
  isCar,
  legendaryBonus,
  legendaryPicksReady,
  legendaryPool,
  ownedVehicles,
  owns,
  partsOf,
  refundedVehicles,
  trophiesEarned,
  vehicleHex,
  worldOf,
  type Part,
  type Vehicle,
  type VehicleClass,
} from './catalog';
import { CAR_H, CAR_W, GY } from './px/cars';
import { FLOOR, SCENE_H, SCENE_W, STAGE_LIFT, garageSceneUrl } from './px/garage';
import { CharacterSprite, HEADROOM, SPRITE_H, SPRITE_W } from './char/CharacterSprite';
import { vehicleSprite } from './px/sprite';
import { TW_W } from './px/twowheel';
import { BuyButton, Requirements } from './ui';
import { CarFund } from './CarFund';
import type { Pending } from './WorldView';

/* ---------------------------------------------------------------- the scene */

/**
 * The garage as one pixel-art picture: the place you built, the upgrades you fitted, the trophies
 * you earned, and your character standing next to the vehicle in the spotlight. Everything shares
 * one pixel size. Rare rides get a coloured light, epic and legendary ones sparkle.
 */
export function GarageScene({
  world,
  stats,
  vehicle,
  hex,
  parts,
  look,
  env,
  upgrades,
  className = '',
  swapKey,
  arrive,
}: {
  world: WorldState;
  stats: DerivedStats;
  vehicle: Vehicle | null;
  hex?: string;
  parts?: CarMods;
  look: Parameters<typeof avatarPixels>[0];
  env?: string;
  /** Upgrades to show (to preview one you don't have yet). Defaults to the ones you own. */
  upgrades?: Set<string>;
  className?: string;
  swapKey?: string | number;
  /** A new `arrive` value drives the vehicle in and makes the character cheer. */
  arrive?: number;
}) {
  const earned = useMemo(() => trophiesEarned(stats), [stats]);
  const place = env ?? garageEnvOf(world).id;
  const up = upgrades ?? garageUpgradesOf(world);
  const vw = vehicle ? (isCar(vehicle) ? CAR_W : TW_W) : 0;
  // Vehicle: right of centre, wheels on the floor line. Character: to its left.
  const vx = vehicle ? (isCar(vehicle) ? 58 : 86) : 0;
  const stage = vehicle ? { x0: vx + 4, x1: vx + vw - 4 } : undefined;
  const bg = garageSceneUrl(place, earned, up, stage);
  const car = vehicle ? vehicleSprite(vehicle, hex ?? vehicleHex(world, vehicle), parts ?? partsOf(world, vehicle), { crop: false, lights: place === 'gx-rooftop' }) : null;
  const lift = vehicle && up.has('gu-plinth') ? STAGE_LIFT : 0;
  const pct = (n: number, of: number) => `${(n / of) * 100}%`;
  const rarity = vehicle?.rarity ?? 'common';
  const shine = rarity === 'epic' || rarity === 'legendary';
  const clip = useMemo(() => (arrive ? { name: 'celebrate' as const, key: arrive } : null), [arrive]);
  const heroX = vehicle ? vx - 28 : 80;
  const box = (x: number, y: number, w: number, h: number) => ({ left: pct(x, SCENE_W), top: pct(y, SCENE_H), width: pct(w, SCENE_W), height: pct(h, SCENE_H) });
  return (
    <div className={`garage-scene relative w-full overflow-hidden ${className}`} style={{ aspectRatio: `${SCENE_W} / ${SCENE_H}` }}>
      <img key={bg.length + place} src={bg} alt="" className="px-art absolute inset-0 w-full h-full garage-bg" draggable={false} />
      {vehicle && rarity !== 'common' && <span className={`garage-rarity is-${rarity}`} style={{ ['--rc' as string]: RARITY_COLOR[rarity] }} aria-hidden="true" />}
      {car && vehicle && up.has('gu-floor') && (
        // The shine on the floor: the vehicle mirrored under the floor line.
        <span className="absolute overflow-hidden pointer-events-none" style={box(0, FLOOR + 1 - lift, SCENE_W, SCENE_H - FLOOR)} aria-hidden="true">
          <img
            key={`r-${vehicle.id}-${swapKey ?? ''}`}
            src={car.url}
            alt=""
            draggable={false}
            className="px-art absolute garage-reflect"
            style={{ left: pct(vx, SCENE_W), top: `${(-(CAR_H - GY) / (SCENE_H - FLOOR)) * 100}%`, width: pct(vw, SCENE_W), height: `${(CAR_H / (SCENE_H - FLOOR)) * 100}%` }}
          />
        </span>
      )}
      {car && vehicle && (
        <img
          key={`${vehicle.id}-${swapKey ?? ''}-${arrive ?? ''}`}
          src={car.url}
          alt={vehicle.name}
          draggable={false}
          className={`px-art absolute ${arrive ? 'garage-veh-arrive' : 'garage-veh'}`}
          style={box(vx, FLOOR - GY - lift, vw, CAR_H)}
        />
      )}
      {vehicle && shine && (
        <span className="absolute pointer-events-none" style={box(vx, FLOOR - GY - lift, vw, CAR_H)} aria-hidden="true">
          {[14, 38, 61, 83].map((l, i) => (
            <span key={i} className="garage-spark" style={{ left: `${l}%`, top: `${[30, 52, 24, 46][i]}%`, animationDelay: `${i * 0.7}s`, ['--rc' as string]: RARITY_COLOR[rarity] }} />
          ))}
        </span>
      )}
      {arrive ? <span key={`dust-${arrive}`} className="garage-dust" style={box(vx + vw - 30, FLOOR - 8, 40, 10)} aria-hidden="true" /> : null}
      <span className="absolute" style={box(heroX, FLOOR - 31 - HEADROOM, SPRITE_W, SPRITE_H)}>
        <CharacterSprite look={look} base="idle" clip={clip} title="You" />
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------- garage section */

type Filter = 'all' | 'owned' | VehicleClass;
const FILTERS: Filter[] = ['all', 'owned', 'car', 'special', 'legendary', 'motorcycle', 'escooter', 'bicycle'];
const PART_TABS: Array<{ id: keyof CarMods | 'paint'; label: string }> = [
  { id: 'paint', label: 'Paint' },
  { id: 'livery', label: 'Livery' },
  { id: 'rim', label: 'Wheels' },
  { id: 'rimColor', label: 'Rim finish' },
  { id: 'spoiler', label: 'Spoiler' },
  { id: 'kit', label: 'Body kit' },
  { id: 'stance', label: 'Height' },
];

const RARITY_LABEL: Record<Vehicle['rarity'], string> = { common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };

export function GarageSection({ stats, onBuy, bought }: { stats: DerivedStats; onBuy: (p: Pending) => void; bought: { id: string; key: number } | null }) {
  const { state, dispatch } = useApp();
  const world = worldOf(state);
  const owned = ownedVehicles(world);
  const spots = garageSpots(world);
  const full = garageUsed(world) >= spots;
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [tab, setTab] = useState<(typeof PART_TABS)[number]['id']>('paint');
  const [tryPart, setTryPart] = useState<Part | null>(null);
  const [tryPaint, setTryPaint] = useState<string | null>(null);
  const [tryEnv, setTryEnv] = useState<string | null>(null);
  const [tryUp, setTryUp] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const featured = VEHICLES.find((v) => v.id === world.vehicle && owns(world, v.id)) ?? owned[0] ?? VEHICLES[0];
  const stage = (inspectId && VEHICLES.find((v) => v.id === inspectId)) || featured;
  const have = owns(world, stage.id);
  const car = isCar(stage);
  const parts: Required<CarMods> = { ...partsOf(world, stage), ...(tryPart ? { [tryPart.kind]: tryPart.value } : {}) };
  const hex = tryPaint ?? vehicleHex(world, stage);
  const gate = canUnlock(stage.unlock, stats);
  const picks = legendaryPicksReady(world, stats);
  const bonus = legendaryBonus(world);
  const refunds = refundedVehicles(world);
  const refundSeen = (state.guide ?? []).includes('garage-refund-2026-11');
  const myUpgrades = garageUpgradesOf(world);
  const tuned = tunedStats(stage, parts);
  const parked = owned.filter((v) => v.id !== stage.id);

  const list = useMemo(() => {
    const l = VEHICLES.filter((v) => (filter === 'all' ? true : filter === 'owned' ? owns(world, v.id) : v.cls === filter));
    const rank = (v: Vehicle) => (owns(world, v.id) ? 0 : v.cls === 'legendary' ? 3 : v.unlock.chest ? 2 : 1);
    return [...l].sort((a, b) => rank(a) - rank(b) || a.unlock.level - b.unlock.level || a.unlock.coins - b.unlock.coins);
  }, [filter, world]);
  const count = (f: Filter) => VEHICLES.filter((v) => (f === 'all' ? true : f === 'owned' ? owns(world, v.id) : v.cls === f)).length;

  function inspect(v: Vehicle) {
    setInspectId(v.id === featured.id ? null : v.id);
    setTryPart(null);
    setTryPaint(null);
    if (!isCar(v)) setTab('paint');
    document.querySelector('.garage-scene')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const nextSpot = GARAGE_SPOTS.find((g) => !(g.id in world.paid));
  const tabParts = tab === 'paint' ? [] : PARTS.filter((p) => p.kind === tab);
  const silhouette = stage.cls === 'legendary' && !have;

  return (
    <>
      <CarFund vehicle={isCar(featured) ? featured : (VEHICLES.find((v) => isCar(v) && v.cls === "car") ?? featured)} />
      {refunds.length > 0 && !refundSeen && (
        <div className="rounded-[20px] bg-amber-500/10 p-3.5 flex items-start gap-3 text-[13px]">
          <Icon name="🚗" size={18} className="shrink-0 mt-0.5 text-amber-300" />
          <p className="flex-1 text-slate-300">
            <b className="text-white">New collection.</b> The old 300 generated cars were replaced by hand-made pixel vehicles. The {refunds.length === 1 ? 'car' : `${refunds.length} cars`} you bought went back as{' '}
            <b className="text-white">{refunds.reduce((n, r) => n + r.coins, 0).toLocaleString()} coins</b>, so you can pick again.
          </p>
          <button onClick={() => dispatch({ type: 'GUIDE_MARK', key: 'garage-refund-2026-11' })} className="shrink-0 text-xs font-semibold text-slate-400" aria-label="Got it">
            <Icon name="✕" size={14} />
          </button>
        </div>
      )}

      {/* the scene */}
      <div className="garage-card theme-dark relative overflow-hidden rounded-[24px]">
        <GarageScene
          world={world}
          stats={stats}
          vehicle={stage}
          hex={hex}
          parts={parts}
          look={state.character}
          env={tryEnv ?? undefined}
          upgrades={tryUp ? new Set([...myUpgrades, tryUp]) : undefined}
          arrive={bought && bought.id === stage.id ? bought.key : undefined}
          swapKey={`${hex}${JSON.stringify(parts)}`}
          className={silhouette ? 'garage-silhouette' : ''}
        />
        <div className="absolute left-3 top-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
          <div className="min-w-0 rounded-xl bg-black/55 backdrop-blur-sm px-2.5 py-1.5">
            <p className="px-label text-[8px] leading-none" style={{ color: RARITY_COLOR[stage.rarity] }}>
              {RARITY_LABEL[stage.rarity]}
            </p>
            <p className="mt-1 font-display text-[16px] font-semibold text-[#fff] leading-tight truncate">{stage.name}</p>
            <p className="text-[11px] text-white/60 leading-tight truncate">{stage.maker}</p>
          </div>
          <span className="shrink-0 rounded-full bg-black/55 backdrop-blur-sm px-2.5 py-1 num-px text-[17px] text-[#fff]">
            {garageUsed(world)}/{spots === Infinity ? '∞' : Math.max(spots, garageUsed(world))}
            <span className="ml-1 font-sans text-[10px] font-semibold text-white/60">spots</span>
          </span>
        </div>
      </div>

      {stage.stats && tuned && (
        <div className="grid grid-cols-3 gap-2 -mt-1">
          {(
            [
              [tuned.hp, stage.stats.hp, 'hp', ''],
              [tuned.zeroTo100, stage.stats.zeroTo100, '0–100', 's'],
              [tuned.top, stage.stats.top, 'km/h', ''],
            ] as const
          ).map(([v, base, l, unit]) => {
            // Lower is better for 0–100.
            const better = l === '0–100' ? v < base : v > base;
            const worse = l === '0–100' ? v > base : v < base;
            return (
              <div key={l} className="rounded-2xl bg-white/[0.04] py-2 text-center">
                <p className="num-px text-[24px] text-white leading-none">
                  {v}
                  {unit}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {l}
                  {(better || worse) && (
                    <span className={`ml-1 normal-case tracking-normal ${better ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {v > base ? '+' : '−'}
                      {Math.abs(Math.round((v - base) * 10) / 10)}
                    </span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}
      {tuned && stage.stats && (tuned.hp !== stage.stats.hp || tuned.top !== stage.stats.top || tuned.zeroTo100 !== stage.stats.zeroTo100) && (
        <p className="-mt-1 text-[11px] text-slate-500 text-center">Green and red numbers are what your parts change.</p>
      )}

      {parked.length > 0 && (
        <div>
          <p className="eyebrow">Parked in your garage</p>
          <div className="mt-2 -mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {parked.map((v) => {
              const sp = vehicleSprite(v, vehicleHex(world, v), partsOf(world, v), { crop: true });
              return (
                <button key={v.id} onClick={() => inspect(v)} className={`veh-tile shrink-0 w-[112px] rounded-2xl p-1.5 text-left ${v.cls === 'legendary' ? 'is-legend' : ''}`} aria-label={`Look at ${v.name}`}>
                  <span className="veh-plinth flex items-end justify-center rounded-xl h-[48px] px-1.5 pb-1">
                    <img src={sp.url} alt="" draggable={false} className="px-art max-h-full w-auto max-w-full" />
                  </span>
                  <span className="mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-[1px] shrink-0" style={{ background: RARITY_COLOR[v.rarity] }} />
                    <span className="text-[11px] font-semibold text-white truncate">{v.name}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {picks.length > 0 && (
        <button onClick={() => setPicking(true)} className="legend-pick-cta w-full rounded-[22px] p-4 flex items-center gap-3 text-left">
          <span className="shrink-0 w-11 h-11 rounded-2xl bg-[#d4a63a] text-[#2a1c05] flex items-center justify-center">
            <Icon name="🏆" size={22} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="px-label block text-[9px] text-[#f3d27a]">Legendary pick unlocked</span>
            <span className="block font-display text-[17px] font-semibold text-[#fff]">Choose your legendary vehicle</span>
            <span className="block text-[12px] text-white/70">You earned it: {picks[0].label.toLowerCase()}.</span>
          </span>
          <Icon name="›" size={20} className="text-[#fff]" />
        </button>
      )}

      {/* get it, or make it yours */}
      {!have ? (
        <div className="rounded-[22px] bg-white/[0.035] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] text-slate-300 leading-snug">{stage.blurb}</p>
              {stage.cls === 'legendary' ? (
                <ul className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                  <li className="rounded-full px-2 py-0.5 font-semibold bg-[#d4a63a]/15 text-[#f3d27a]">{(LEGENDARY_CHEST_CHANCE * 100).toFixed(1)}% chance in any chest</li>
                  <li className="rounded-full px-2 py-0.5 font-semibold bg-[#d4a63a]/15 text-[#f3d27a]">Or pick it at level 100</li>
                  <li className="rounded-full px-2 py-0.5 font-semibold bg-white/[0.06] text-slate-300">+{stage.xpBonus}% XP forever</li>
                </ul>
              ) : (
                <Requirements unlock={stage.unlock} stats={stats} />
              )}
            </div>
            <button onClick={() => setInspectId(null)} className="shrink-0 text-xs font-semibold text-slate-400 hover:text-white">
              Back to yours
            </button>
          </div>
          {stage.cls !== 'legendary' && (
            <div className="mt-3">
              {full && gate.ok ? (
                <p className="text-[12px] text-slate-400">Your garage is full. Build more space below.</p>
              ) : (
                <BuyButton gate={gate} coins={stage.unlock.coins} onClick={() => onBuy({ id: stage.id, name: stage.name, coins: stage.unlock.coins })} verb={car ? 'Get this car' : 'Get it'} />
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Customise</p>
            {stage.id !== featured.id ? (
              <button
                onClick={() => {
                  dispatch({ type: 'WORLD_FEATURE', vehicleId: stage.id });
                  setInspectId(null);
                }}
                className="text-xs font-semibold text-[var(--mood)]"
              >
                Put in the spotlight
              </button>
            ) : (
              <span className="text-xs font-semibold text-slate-500">In the spotlight</span>
            )}
          </div>
          {car && (
            <div className="-mx-4 px-4 flex gap-1.5 overflow-x-auto no-scrollbar" role="tablist" aria-label="Parts">
              {PART_TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => {
                    setTab(t.id);
                    setTryPart(null);
                    setTryPaint(null);
                  }}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold ${tab === t.id ? 'seg-pill seg-on' : 'bg-white/[0.05] text-slate-300'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          {tab === 'paint' || !car ? (
            <div className="grid grid-cols-6 gap-x-2 gap-y-2.5">
              {PAINTS.map((p) => {
                const mine = owns(world, p.id);
                const on = p.hex === hex;
                const g = canUnlock(p.unlock, stats);
                return (
                  <button
                    key={p.id}
                    onClick={() => (mine ? (setTryPaint(null), dispatch({ type: 'WORLD_PAINT', vehicleId: stage.id, paint: p.id })) : setTryPaint(tryPaint === p.hex ? null : p.hex))}
                    aria-label={`${p.name}${mine ? '' : g.ok ? `, ${p.unlock.coins} coins` : `, locked: ${g.text}`}`}
                    aria-pressed={on}
                    className="flex flex-col items-center gap-1 min-w-0"
                  >
                    <span className={`paint-chip relative w-full aspect-square rounded-xl ${on ? 'is-on' : ''} ${!mine && !g.ok ? 'opacity-40' : ''}`} style={{ ['--chip' as string]: p.hex }}>
                      {!mine && (
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-canvas flex items-center justify-center text-slate-300">
                          <Icon name={g.ok ? 'coin' : '🔒'} size={11} />
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight text-center truncate w-full">{mine ? p.name : p.unlock.chest ? 'Chest' : g.ok ? p.unlock.coins.toLocaleString() : `LV ${p.unlock.level}`}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 min-[420px]:grid-cols-3 gap-2">
              {tabParts.map((p) => {
                const fits = canFit(world, stage, p);
                const on = parts[p.kind] === p.value;
                const g = canUnlock(p.unlock, stats);
                const preview = vehicleSprite(stage, hex, { ...parts, [p.kind]: p.value }, { crop: true });
                return (
                  <button
                    key={p.id}
                    onClick={() => (fits ? (setTryPart(null), dispatch({ type: 'WORLD_MOD', vehicleId: stage.id, partId: p.id })) : setTryPart(tryPart?.id === p.id ? null : p))}
                    aria-pressed={on}
                    className={`part-tile rounded-2xl p-2 text-left transition ${on ? 'is-on' : ''}`}
                  >
                    <span className="part-thumb flex items-end justify-center rounded-xl h-[54px] px-1.5 pb-1">
                      <img src={preview.url} alt="" className={`px-art max-h-full w-auto max-w-full ${!fits && !g.ok ? 'opacity-45' : ''}`} draggable={false} />
                    </span>
                    <span className={`mt-1.5 block text-[12px] font-semibold leading-tight truncate ${fits || g.ok ? 'text-white' : 'text-slate-500'}`}>{p.name}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400 truncate">
                      {fits ? (
                        on ? 'Fitted' : 'Yours'
                      ) : g.ok ? (
                        <>
                          <Coin size={10} /> <span className="num-px text-[14px] text-slate-200">{p.unlock.coins.toLocaleString()}</span>
                        </>
                      ) : (
                        <>
                          <Icon name="🔒" size={9} /> {g.text}
                        </>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {(tryPart || tryPaint) &&
            (() => {
              const item = tryPart ?? PAINTS.find((p) => p.hex === tryPaint)!;
              const g = canUnlock(item.unlock, stats);
              const name = tryPart ? tryPart.name : `${(item as (typeof PAINTS)[number]).name} paint`;
              return (
                <div className="rounded-[20px] bg-white/[0.05] p-3 flex items-center gap-3 toast-in-up">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white">Trying {name}</p>
                    <Requirements unlock={item.unlock} stats={stats} compact />
                  </div>
                  <div className="shrink-0 w-[112px]">
                    <BuyButton
                      gate={g}
                      coins={item.unlock.coins}
                      small
                      onClick={() => {
                        onBuy({ id: item.id, name, coins: item.unlock.coins, vehicleId: stage.id });
                        setTryPart(null);
                        setTryPaint(null);
                      }}
                      verb="Get"
                    />
                  </div>
                </div>
              );
            })()}
        </div>
      )}

      {/* upgrades you build into the garage itself */}
      <div>
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Garage upgrades</p>
          <p className="text-[12px] font-semibold text-slate-400">
            <span className="num-px text-[17px] text-slate-200">{myUpgrades.size}</span>/<span className="num-px text-[17px]">{GARAGE_UPGRADES.length}</span>
          </p>
        </div>
        <p className="mt-1 text-[12px] text-slate-500">Built into your garage picture, and they move with you to every place.</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {GARAGE_UPGRADES.map((u) => {
            const mine = myUpgrades.has(u.id);
            const g = canUnlock(u.unlock, stats);
            const trying = tryUp === u.id;
            return (
              <div key={u.id} className={`part-tile rounded-2xl p-2.5 ${trying ? 'is-on' : ''}`}>
                <button
                  className="block w-full text-left"
                  disabled={mine}
                  onClick={() => {
                    setTryUp(trying ? null : u.id);
                    document.querySelector('.garage-scene')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  aria-label={mine ? `${u.name}, built` : `Preview ${u.name}`}
                >
                  <span className="block text-[13px] font-semibold text-white leading-tight">{u.name}</span>
                  <span className="mt-0.5 block text-[11px] text-slate-400 leading-snug">{u.blurb}</span>
                </button>
                <div className="mt-2">
                  {mine ? (
                    <span className="text-[11px] font-semibold text-emerald-300">Built</span>
                  ) : trying ? (
                    <BuyButton gate={g} coins={u.unlock.coins} small onClick={() => { onBuy({ id: u.id, name: u.name, coins: u.unlock.coins }); setTryUp(null); }} verb="Build" />
                  ) : g.ok || g.reason === 'coins' ? (
                    <button onClick={() => setTryUp(u.id)} className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                      <Coin size={10} /> <span className="num-px text-[14px] text-slate-200">{u.unlock.coins.toLocaleString()}</span>
                      <span className="ml-1 text-[var(--mood)]">Try it</span>
                    </button>
                  ) : (
                    <button onClick={() => setTryUp(u.id)} className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Icon name="🔒" size={9} /> {g.text} <span className="ml-1 font-semibold text-[var(--mood)]">Try it</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {tryUp && <p className="mt-1.5 text-[11px] text-slate-400">Previewing the {GARAGE_UPGRADES.find((u) => u.id === tryUp)?.name.toLowerCase()} above. Tap it again to stop.</p>}
      </div>

      {/* the collection */}
      <div>
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Collection</p>
          <p className="text-[12px] font-semibold text-slate-400">
            <span className="num-px text-[17px] text-slate-200">{owned.length}</span>/<span className="num-px text-[17px]">{VEHICLES.length}</span>
            {bonus > 0 && <span className="ml-2 text-[#f3d27a]">+{bonus}% XP</span>}
          </p>
        </div>
        <div className="mt-2 -mx-4 px-4 flex gap-1.5 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold ${filter === f ? 'seg-pill seg-on' : 'bg-white/[0.05] text-slate-300'}`}
            >
              {f === 'all' ? 'All' : f === 'owned' ? 'Yours' : CLASS_LABEL[f]}
              <span className={`text-[11px] ${filter === f ? 'opacity-70' : 'text-slate-500'}`}>{count(f)}</span>
            </button>
          ))}
        </div>
        <div className="mt-2.5 grid grid-cols-2 min-[520px]:grid-cols-3 gap-2.5">
          {list.map((v) => {
            const mine = owns(world, v.id);
            const on = v.id === stage.id;
            const g = canUnlock(v.unlock, stats);
            const s = vehicleSprite(v, vehicleHex(world, v), partsOf(world, v), { crop: true });
            const legend = v.cls === 'legendary';
            return (
              <button key={v.id} onClick={() => inspect(v)} className={`veh-tile relative rounded-[20px] p-2 text-left ${on ? 'is-on' : ''} ${legend ? 'is-legend' : ''}`} aria-label={`Look at ${v.name}`}>
                <span className="veh-plinth flex items-end justify-center rounded-2xl h-[72px] px-2 pb-1.5">
                  {/* every tile uses the same scale, so a scooter really looks small next to a truck */}
                  <img src={s.url} alt="" draggable={false} style={{ width: `min(100%, ${s.w * 1.4}px)` }} className={`px-art h-auto ${mine ? '' : legend ? 'veh-shadow' : 'veh-locked'}`} />
                </span>
                <span className="mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-[1px] shrink-0" style={{ background: RARITY_COLOR[v.rarity] }} />
                  <span className="text-[13px] font-semibold text-white leading-tight truncate">{legend && !mine ? '???' : v.name}</span>
                </span>
                <span className="block text-[10px] text-slate-400 truncate">{v.maker}</span>
                <span className="mt-1 flex items-center gap-1 text-[10px] font-bold">
                  {mine ? (
                    <span className="text-emerald-300">Yours</span>
                  ) : legend ? (
                    <span className="text-[#f3d27a]">0.3% chest · level 100</span>
                  ) : v.unlock.chest ? (
                    <span className="text-violet-300">Chest only</span>
                  ) : g.ok ? (
                    <>
                      <Coin size={10} /> <span className="num-px text-[15px] text-slate-200">{v.unlock.coins.toLocaleString()}</span>
                    </>
                  ) : (
                    <span className="text-slate-500">Level {v.unlock.level}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* garage places */}
      <div>
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Garage places</p>
          <p className="text-[12px] text-slate-500">Unlock better places as you grow</p>
        </div>
        <div className="mt-2 -mx-4 px-4 flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {GARAGE_ENVS.map((e) => {
            const mine = owns(world, e.id);
            const here = garageEnvOf(world).id === e.id;
            const g = canUnlock(e.unlock, stats);
            return (
              <div key={e.id} className={`shrink-0 w-[210px] rounded-[20px] p-2 ${here ? 'world-home-here' : 'bg-white/[0.035]'}`}>
                <button
                  className="block w-full rounded-xl overflow-hidden"
                  onClick={() => setTryEnv(tryEnv === e.id ? null : e.id)}
                  aria-label={`Preview ${e.name}`}
                >
                  <img src={garageSceneUrl(e.id, trophiesEarned(stats), myUpgrades)} alt="" className={`px-art w-full ${!mine && !g.ok ? 'opacity-50' : ''}`} draggable={false} />
                </button>
                <p className="mt-1.5 text-[13px] font-semibold text-white leading-tight">{e.name}</p>
                <p className="text-[11px] text-slate-400 leading-snug">{e.blurb}</p>
                <div className="mt-2">
                  {here ? (
                    <span className="text-[11px] font-semibold text-emerald-300">You're here</span>
                  ) : mine ? (
                    <button onClick={() => { dispatch({ type: 'WORLD_GARAGE', id: e.id }); setTryEnv(null); }} className="pill-light w-full px-3 py-1.5 text-xs">
                      Move here
                    </button>
                  ) : g.ok ? (
                    <BuyButton gate={g} coins={e.unlock.coins} small onClick={() => { onBuy({ id: e.id, name: e.name, coins: e.unlock.coins }); setTryEnv(null); }} verb="Build" />
                  ) : (
                    <Requirements unlock={e.unlock} stats={stats} compact />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {tryEnv && <p className="mt-1 text-[11px] text-slate-400">Previewing {GARAGE_ENVS.find((e) => e.id === tryEnv)?.name} above. Tap it again to go back.</p>}
      </div>

      {/* trophies: earned by living, never bought */}
      <div className="rounded-[22px] bg-white/[0.035] p-4">
        <p className="eyebrow">Garage trophies</p>
        <p className="mt-1 text-[12px] text-slate-400">Real milestones hang something in your garage. You can't buy these.</p>
        <ul className="mt-3 space-y-2.5">
          {TROPHIES.map((t) => {
            const v = Math.min(stats[t.stat], t.target);
            const done = v >= t.target;
            return (
              <li key={t.id} className="flex items-center gap-3">
                <span className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${done ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/[0.05] text-slate-500'}`}>
                  <Icon name={done ? '✓' : '🔒'} size={14} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={`text-[13px] font-semibold truncate ${done ? 'text-white' : 'text-slate-300'}`}>{t.name}</span>
                    <span className="num-px text-[15px] text-slate-400 shrink-0">
                      {v.toLocaleString()}/{t.target.toLocaleString()}
                    </span>
                  </span>
                  <span className="block text-[11px] text-slate-500">{t.label}</span>
                  <span className="px-bar mt-1 block" style={{ ['--p' as string]: `${(v / t.target) * 100}%` }} />
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* legendary info */}
      <div className="legend-info rounded-[22px] p-4">
        <p className="px-label text-[9px] text-[#f3d27a]">Legendary collection</p>
        <p className="mt-1 font-display text-[17px] font-semibold text-white">The five rarest things in Squzo</p>
        <p className="mt-1 text-[12.5px] text-slate-400 leading-relaxed">
          Each chest has a {(LEGENDARY_CHEST_CHANCE * 100).toFixed(1)}% chance to hold one. Level 100, a 365-day streak and 2,000 finished quests each let you pick one. Every legendary adds +1% XP for good, up to +{LEGENDARY_BONUS_CAP}%.
        </p>
        <p className="mt-2 text-[12px] text-slate-300">
          You own <span className="num-px text-[17px] text-white">{VEHICLES.filter((v) => v.cls === 'legendary' && owns(world, v.id)).length}</span> of 5 · bonus{' '}
          <span className="num-px text-[17px] text-[#f3d27a]">+{bonus}%</span>
        </p>
      </div>

      {nextSpot && (
        <div className="rounded-[22px] bg-white/[0.035] p-4 flex items-center gap-3">
          <span className="shrink-0 w-11 h-11 rounded-2xl bg-white/[0.06] text-slate-300 flex items-center justify-center">
            <Icon name="＋" size={20} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white">{nextSpot.label ?? 'Bigger garage'}</p>
            <p className="text-[13px] text-slate-400">{nextSpot.label ? 'More room for your collection.' : `Room for one more vehicle (${spots + 1} spots).`}</p>
            <Requirements unlock={nextSpot.unlock} stats={stats} />
          </div>
          <div className="shrink-0 w-[96px]">
            <BuyButton gate={canUnlock(nextSpot.unlock, stats)} coins={nextSpot.unlock.coins} small onClick={() => onBuy({ id: nextSpot.id, name: nextSpot.label?.toLowerCase() ?? 'a bigger garage', coins: nextSpot.unlock.coins })} verb="Build" />
          </div>
        </div>
      )}

      {picking && createPortal(<LegendaryPick onClose={() => setPicking(false)} />, document.body)}
    </>
  );
}

/* ---------------------------------------------------------------- legendary pick */

function LegendaryPick({ onClose }: { onClose: () => void }) {
  const { state, stats, dispatch } = useApp();
  useBackToClose(true, onClose);
  const world = worldOf(state);
  const picks = legendaryPicksReady(world, stats);
  const pool = legendaryPool(world);
  const [sel, setSel] = useState<string | null>(pool[0]?.id ?? null);
  const pick = picks[0];
  const chosen = pool.find((v) => v.id === sel);
  return (
    <div data-overlay className="theme-dark box-stage fixed inset-0 z-[80] flex flex-col backdrop-in">
      <div className="shrink-0 flex items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <button onClick={onClose} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-full text-slate-300 hover:bg-white/10">
          <Icon name="✕" size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="px-label text-[9px] text-[#f3d27a]">{pick?.label ?? 'Legendary pick'}</p>
          <p className="font-display text-lg font-semibold text-white">Choose one legendary</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2.5">
        {pool.map((v) => {
          const s = vehicleSprite(v, vehicleHex(world, v), partsOf(world, v), { crop: true });
          const on = v.id === sel;
          return (
            <button key={v.id} onClick={() => setSel(v.id)} className={`veh-tile is-legend w-full rounded-[20px] p-3 flex items-center gap-3 text-left ${on ? 'is-on' : ''}`}>
              <span className="veh-plinth shrink-0 w-[132px] h-[64px] rounded-2xl flex items-end justify-center pb-1.5">
                <img src={s.url} alt="" className="px-art max-h-[52px] w-auto max-w-[124px]" draggable={false} />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-white">{v.name}</span>
                <span className="block text-[11px] text-slate-400 leading-snug">{v.blurb}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <button
          disabled={!chosen || !pick}
          onClick={() => {
            if (!chosen || !pick) return;
            dispatch({ type: 'LEGENDARY_PICK', pickId: pick.id, vehicleId: chosen.id });
            onClose();
          }}
          className="w-full rounded-2xl bg-[#d4a63a] text-[#2a1c05] font-bold py-3.5 disabled:opacity-40"
        >
          {chosen ? `Take the ${chosen.name}` : 'Pick one'}
        </button>
        <p className="mt-2 text-center text-[11px] text-slate-500">This can't be changed later. It adds +1% XP for good.</p>
      </div>
    </div>
  );
}
