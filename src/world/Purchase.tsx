import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../store/AppContext';
import { useBackToClose } from '../lib/backstack';
import { BUY_XP_SHARE } from '../lib/xp';
import { Coin } from '../components/Coin';
import { Confetti } from '../components/Confetti';
import { Icon } from '../components/Icon';
import { OpenBurst, PrizeHalo, StageLight } from '../components/fx/RewardFx';
import { Gift } from '../components/fx/Gift';
import './reveal.css';
import { VehicleDraw } from './VehicleDraw';
import { HomeThumb } from './room/Room';
import { garageSceneUrl } from './px/garage';
import { DECOR, GARAGE_ENVS, GARAGE_SPOTS, PAINTS, PARTS, PROPERTIES, RARITY_COLOR, VEHICLES, partsOf, vehicleHex, worldOf, type Vehicle } from './catalog';

/**
 * Buying, made fun (2026-11-17). A shop sheet that shows the thing on a lit plinth with what it
 * costs, what you'll have left and the XP you get back; you hold the button to buy (like a game
 * shop), then a short celebration that fits what you bought: a new ride rolls in, a home's door
 * opens, decor is unboxed, an upgrade sparkles.
 */

export type Kind = 'vehicle' | 'home' | 'decor' | 'upgrade' | 'garage';

export interface Buyable {
  id: string;
  name: string;
  coins: number;
  vehicleId?: string;
}

export function kindOf(id: string): Kind {
  if (VEHICLES.some((v) => v.id === id)) return 'vehicle';
  if (PROPERTIES.some((p) => p.id === id)) return 'home';
  if (GARAGE_ENVS.some((g) => g.id === id) || GARAGE_SPOTS.some((g) => g.id === id)) return 'garage';
  if (PAINTS.some((p) => p.id === id) || PARTS.some((p) => p.id === id)) return 'upgrade';
  return 'decor';
}

const LABEL: Record<Kind, { tag: string; done: string; color: string }> = {
  vehicle: { tag: 'New ride', done: 'It’s yours. Time for a drive.', color: '#7cc7ff' },
  home: { tag: 'New home', done: 'Welcome home.', color: '#fcd34d' },
  decor: { tag: 'For your room', done: 'Unboxed and placed in your room.', color: '#f9a8d4' },
  upgrade: { tag: 'Upgrade', done: 'Fitted. Looking sharp.', color: '#a3e635' },
  garage: { tag: 'Garage', done: 'Your cars just moved in.', color: '#c4b5fd' },
};

/** The thing itself, drawn the way the game draws it. */
export function BuyArt({ item, decorThumb, big = false }: { item: Buyable; decorThumb?: (id: string) => ReactNode; big?: boolean }) {
  const { state } = useApp();
  const world = worldOf(state);
  const kind = kindOf(item.id);
  if (kind === 'vehicle') {
    const v = VEHICLES.find((x) => x.id === item.id)!;
    return <VehicleDraw vehicle={v} hex={vehicleHex(world, v)} parts={partsOf(world, v)} className={big ? 'w-[min(280px,78vw)]' : 'w-[220px]'} />;
  }
  if (kind === 'upgrade') {
    const v: Vehicle | undefined = VEHICLES.find((x) => x.id === item.vehicleId);
    if (!v) return null;
    const paint = PAINTS.find((p) => p.id === item.id);
    const part = PARTS.find((p) => p.id === item.id);
    return <VehicleDraw vehicle={v} hex={paint?.hex ?? vehicleHex(world, v)} parts={{ ...partsOf(world, v), ...(part ? { [part.kind]: part.value } : {}) }} className={big ? 'w-[min(280px,78vw)]' : 'w-[220px]'} />;
  }
  if (kind === 'home') return <HomeThumb id={item.id} className={`${big ? 'w-[min(300px,80vw)]' : 'w-[240px]'} aspect-[16/10] rounded-2xl`} />;
  if (kind === 'garage' && GARAGE_ENVS.some((g) => g.id === item.id)) return <img src={garageSceneUrl(item.id, new Set())} alt="" className={`px-art ${big ? 'w-[min(300px,80vw)]' : 'w-[240px]'} rounded-2xl`} />;
  const d = DECOR.find((x) => x.id === item.id);
  if (d && decorThumb) return <div className={big ? 'w-[220px]' : 'w-[180px]'}>{decorThumb(d.id)}</div>;
  // Anything without its own art (like a bigger garage) still gets a proper card instead of an empty plinth.
  return (
    <div className={`${big ? 'w-[180px] h-[180px]' : 'w-[140px] h-[140px]'} rounded-[28%] flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-[#26324a] to-[#141a28] ring-1 ring-white/15`}>
      <Icon name={kind === 'garage' ? '🚗' : '🎁'} size={big ? 72 : 56} strokeWidth={1.6} className="text-white" />
      {kind === 'garage' && <span className="px-label text-[10px] text-violet-200">+ space</span>}
    </div>
  );
}

/** Step 1: the shop sheet. Hold to buy. */
export function PurchaseSheet({ item, balance, onCancel, onBuy, decorThumb }: { item: Buyable | null; balance: number; onCancel: () => void; onBuy: () => void; decorThumb?: (id: string) => ReactNode }) {
  // The hold fill is written straight to the button's CSS variable each frame. Before (2026-11-25)
  // it was React state, so the whole sheet, art included, re-rendered ~40 times per purchase.
  const [holding, setHolding] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const raf = useRef(0);
  const start = useRef(0);
  useBackToClose(!!item, onCancel);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  if (!item) return null;
  const kind = kindOf(item.id);
  const label = LABEL[kind];
  const left = balance - item.coins;
  const xp = Math.round(item.coins * BUY_XP_SHARE);

  const HOLD_MS = 650;
  const fill = (p: number) => btn.current?.style.setProperty('--hold', `${p * 100}%`);
  function down() {
    cancelAnimationFrame(raf.current);
    start.current = performance.now();
    setHolding(true);
    const step = (t: number) => {
      const p = Math.min(1, (t - start.current) / HOLD_MS);
      fill(p);
      if (p >= 1) {
        try {
          navigator.vibrate?.(30);
        } catch {
          // optional
        }
        fill(0);
        setHolding(false);
        onBuy();
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }
  function up() {
    cancelAnimationFrame(raf.current);
    fill(0);
    setHolding(false);
  }

  return createPortal(
    <div data-overlay className="theme-dark fixed inset-0 z-[85] flex items-end justify-center bg-black/60 backdrop-in" onClick={onCancel}>
      <div className="shop-sheet w-full max-w-md rounded-t-[28px] px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sheet-up" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto w-10 h-1 rounded-full bg-white/20" />
        <div className="relative mt-3 h-[170px] flex items-end justify-center">
          <StageLight tint={label.color} lit />
          <span className="shop-plinth absolute bottom-1 left-1/2 -translate-x-1/2" aria-hidden="true" />
          <div className="relative mb-4 shop-float">
            <BuyArt item={item} decorThumb={decorThumb} />
          </div>
        </div>
        <p className="mt-2 text-center px-label text-[10px]" style={{ color: label.color }}>{label.tag}</p>
        <p className="text-center font-display text-[24px] font-semibold text-[#fff] leading-tight mt-1">{item.name}</p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="shop-stat">
            <span className="flex items-center justify-center gap-1">
              <Coin size={14} />
              <span className="num-px text-[22px] text-[#fff]">{item.coins.toLocaleString()}</span>
            </span>
            <span className="px-label text-[8px] text-slate-400">Price</span>
          </div>
          <div className="shop-stat">
            <span className={`num-px text-[22px] ${left < 0 ? 'text-red-300' : 'text-[#fff]'}`}>{Math.max(0, left).toLocaleString()}</span>
            <span className="px-label text-[8px] text-slate-400">Left after</span>
          </div>
          <div className="shop-stat">
            <span className="num-px text-[22px] text-emerald-300">+{xp}</span>
            <span className="px-label text-[8px] text-slate-400">XP back</span>
          </div>
        </div>

        <button
          onPointerDown={down}
          onPointerUp={up}
          onPointerLeave={up}
          onPointerCancel={up}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onBuy()}
          onContextMenu={(e) => e.preventDefault()}
          ref={btn}
          className="shop-buy relative mt-4 w-full overflow-hidden rounded-2xl py-4 text-[16px] font-bold text-[#1a1205] select-none touch-none"
        >
          <span className="relative z-[1] flex items-center justify-center gap-2">
            <Icon name="🛒" size={18} />
            {holding ? 'Keep holding…' : 'Hold to buy'}
          </span>
        </button>
        <button onClick={onCancel} className="mt-2 w-full py-2.5 text-[14px] font-semibold text-slate-400 hover:text-white">
          Not now
        </button>
      </div>
    </div>,
    document.body,
  );
}

type Rarity = Vehicle['rarity'];
const RARITY_LABEL: Record<Rarity, string> = { common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };

/** How special a purchase is: vehicles have their own rarity, homes their tier, the rest goes by price. */
export function rarityOf(item: Buyable): Rarity {
  const v = VEHICLES.find((x) => x.id === item.id);
  if (v) return v.rarity;
  const home = PROPERTIES.find((p) => p.id === item.id);
  if (home) return home.tier >= 6 ? 'legendary' : home.tier >= 5 ? 'epic' : home.tier >= 3 ? 'rare' : 'common';
  return item.coins >= 6000 ? 'legendary' : item.coins >= 1500 ? 'epic' : item.coins >= 300 ? 'rare' : 'common';
}

function reducedMotion(): boolean {
  try {
    return document.documentElement.dataset.motion === 'reduce' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function buzz(p: number | number[]) {
  try {
    navigator.vibrate?.(p);
  } catch {
    // optional
  }
}

type Phase = 'arrive' | 'charge' | 'open' | 'reveal' | 'show' | 'out';

/**
 * Step 2: the reveal (rebuilt 2026-11-25). Before, decor shook in a box for a moment and then the
 * item simply replaced the box. Now every purchase has a little story:
 * arrive (the box drops in, or the vehicle/home appears as a dark silhouette) → charge (knocks
 * that build up, light leaking out; rarer things knock more) → open (lid flies off, light and coins
 * pour out, a soft flash in the rarity colour) → reveal (the item rises out of the box and comes into
 * colour) → show (rarity, name, an "Owned" stamp and the XP you got back, one after another).
 * Tap during the build-up to skip ahead; tap at the end and it fades out, and only then does the
 * item drop into your room or garage, so it feels like it moves in.
 */
export function PurchaseCelebration({ item, onDone, decorThumb }: { item: Buyable | null; onDone: () => void; decorThumb?: (id: string) => ReactNode }) {
  const [phase, setPhase] = useState<Phase>('arrive');
  const [beat, setBeat] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const later = (ms: number, fn: () => void) => void timers.current.push(setTimeout(fn, ms));
  const kind = item ? kindOf(item.id) : 'decor';
  const rarity = item ? rarityOf(item) : 'common';
  const beats = rarity === 'legendary' ? 4 : rarity === 'epic' ? 3 : 2;
  const boxed = kind === 'decor' || kind === 'upgrade';

  const close = useCallback(() => {
    clear();
    setPhase('out');
    timers.current.push(setTimeout(onDone, reducedMotion() ? 0 : 280));
  }, [onDone]);
  useBackToClose(!!item, close);

  const show = useCallback(() => {
    clear();
    setPhase('show');
    later(6500, close);
  }, [close]);

  const burst = useCallback(() => {
    clear();
    setPhase('open');
    buzz(60);
    later(boxed ? 420 : 300, () => {
      setPhase('reveal');
      later(750, show);
    });
  }, [boxed, show]);

  useEffect(() => {
    if (!item) return;
    clear();
    setBeat(0);
    if (reducedMotion()) {
      setPhase('show');
      later(6500, close);
      return clear;
    }
    setPhase('arrive');
    const arrive = kind === 'vehicle' ? 900 : 480;
    later(arrive, () => {
      setPhase('charge');
      for (let i = 0; i < beats; i++)
        later(i * 320, () => {
          setBeat(i + 1);
          buzz(14 + i * 8);
        });
      later(beats * 320 + 120, burst);
    });
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  if (!item) return null;
  const label = LABEL[kind];
  const color = RARITY_COLOR[rarity];
  const xp = Math.round(item.coins * BUY_XP_SHARE);
  const before = phase === 'arrive' || phase === 'charge';
  const revealed = phase === 'reveal' || phase === 'show' || phase === 'out';
  const charge = beats ? beat / beats : 0;
  const tap = () => (before ? burst() : phase === 'show' ? close() : undefined);

  return createPortal(
    <div
      data-overlay
      className={`theme-dark box-stage pr-stage fixed inset-0 z-[86] flex flex-col items-center justify-center px-6 ${phase === 'out' ? 'pr-out' : ''}`}
      style={{ ['--ray' as string]: color }}
      onClick={tap}
      role="dialog"
      aria-label={`${label.tag}: ${item.name}`}
    >
      {/* No fade-in on the dark stage: the shop sheet is dark too, so cutting straight to it never flashes the page underneath. */}
      <StageLight tint={label.color} lit={!before} />
      <span className="box-stage-floor" aria-hidden="true" />
      {phase === 'open' && <span className="pr-flash" aria-hidden="true" />}
      {phase === 'show' && <Confetti count={rarity === 'legendary' ? 44 : 28} />}

      <div className="relative flex flex-col items-center">
        <div className="pr-pod relative -translate-y-[9vh]" style={{ ['--charge' as string]: String(charge) }}>
          {before && <span className="pr-leak" aria-hidden="true" />}
          {revealed && <PrizeHalo color={color} big={rarity === 'legendary' || rarity === 'epic'} />}
          {revealed && rarity !== 'common' && <span className="pr-rays" aria-hidden="true" />}

          {boxed ? (
            <>
              {/* the box: drops in, knocks, opens, then sinks away under the item */}
              {phase !== 'show' && phase !== 'out' && (
                <span className={`pr-box ${phase === 'arrive' ? 'pr-drop' : ''} ${phase === 'reveal' ? 'pr-sink' : ''}`}>
                  <span key={phase === 'charge' ? `k${beat}` : phase} className={phase === 'charge' && beat > 0 ? 'pr-knock' : ''} style={{ ['--amp' as string]: String(1 + beat * 0.5) }}>
                    <Gift size={176} phase={phase === 'open' || phase === 'reveal' ? 'open' : 'idle'} />
                  </span>
                </span>
              )}
              {phase === 'open' && <OpenBurst color={color} coins={8} />}
              {revealed && (
                <div className="pr-rise relative">
                  <div className="pr-bob">
                    <BuyArt item={item} decorThumb={decorThumb} big />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* vehicles, homes and garages: a dark silhouette that lights up */}
              {phase === 'open' && <OpenBurst color={color} coins={6} />}
              <div className={kind === 'vehicle' && phase === 'arrive' ? 'buy-drive-in' : phase === 'arrive' ? 'pr-fade-up' : ''}>
                <div key={phase === 'charge' ? `k${beat}` : 'art'} className={phase === 'charge' && beat > 0 ? 'pr-knock' : ''} style={{ ['--amp' as string]: String(0.6 + beat * 0.3) }}>
                  <div className={`relative ${before ? (kind === 'vehicle' ? 'pr-sil' : 'pr-sil pr-soft') : kind === 'vehicle' ? 'pr-resolve' : 'pr-resolve pr-soft'}`}>
                    <div className={revealed ? 'pr-bob' : ''}>
                      <BuyArt item={item} decorThumb={decorThumb} big />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="pr-info absolute top-full left-1/2 -translate-x-1/2 w-[min(340px,88vw)] mt-5 flex flex-col items-center text-center" data-on={phase === 'show' || phase === 'out' ? '' : undefined}>
          <p className="pr-i1 flex items-center gap-2">
            <span className="pr-rarity px-label text-[10px]" style={{ color, borderColor: `${color}88`, background: `${color}1f` }}>{RARITY_LABEL[rarity]}</span>
            <span className="px-label text-[10px]" style={{ color: label.color }}>{label.tag}</span>
          </p>
          <p className="pr-i2 mt-2 font-display text-[28px] font-semibold text-[#fff] leading-tight">{item.name}</p>
          <p className="pr-i3 mt-1 text-[14px] text-slate-300">{label.done}</p>
          <div className="pr-i4 mt-4 flex items-center gap-2">
            <span className="pr-owned px-label text-[11px]">
              <Icon name="✓" size={14} strokeWidth={3} /> Owned
            </span>
            {xp > 0 && (
              <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-emerald-200">
                <span className="num-px text-[20px]">+{xp} XP</span>
              </span>
            )}
          </div>
          <p className="pr-i5 mt-5 text-[12px] text-slate-500">Tap to continue</p>
        </div>
        {before && <p className="absolute top-full mt-10 left-0 right-0 text-center text-[12px] text-slate-500">Tap to skip</p>}
      </div>
    </div>,
    document.body,
  );
}
