import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../store/AppContext';
import { useBackToClose } from '../lib/backstack';
import { BUY_XP_SHARE } from '../lib/xp';
import { Coin } from '../components/Coin';
import { Icon } from '../components/Icon';
import { StageLight } from '../components/fx/RewardFx';
import './reveal.css';
import { VehicleDraw } from './VehicleDraw';
import { HomeThumb } from './room/Room';
import { garageSceneUrl } from './px/garage';
import { DECOR, GARAGE_ENVS, GARAGE_SPOTS, GARAGE_UPGRADES, PAINTS, PARTS, PROPERTIES, RARITY_COLOR, VEHICLES, garageEnvOf, garageUpgradesOf, partsOf, vehicleHex, worldOf, type Vehicle } from './catalog';

/**
 * Buying, made fun (2026-11-17). A shop sheet that shows the thing on a lit plinth with what it
 * costs, what you'll have left and the XP you get back; you hold the button to buy (like a game
 * shop), then the thing materialises in its real place (see PurchaseToast).
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
  if (GARAGE_ENVS.some((g) => g.id === id) || GARAGE_SPOTS.some((g) => g.id === id) || GARAGE_UPGRADES.some((g) => g.id === id)) return 'garage';
  if (PAINTS.some((p) => p.id === id) || PARTS.some((p) => p.id === id)) return 'upgrade';
  return 'decor';
}

const LABEL: Record<Kind, { tag: string; done: string; color: string }> = {
  vehicle: { tag: 'New ride', done: 'Parked in your garage.', color: '#7cc7ff' },
  home: { tag: 'New home', done: 'Welcome home.', color: '#fcd34d' },
  decor: { tag: 'For your room', done: 'Placed in your room.', color: '#f9a8d4' },
  upgrade: { tag: 'Upgrade', done: 'Fitted to your car.', color: '#a3e635' },
  garage: { tag: 'Garage', done: 'Built into your garage.', color: '#c4b5fd' },
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
  if (GARAGE_UPGRADES.some((g) => g.id === item.id))
    return <img src={garageSceneUrl(garageEnvOf(world).id, new Set(), new Set([...garageUpgradesOf(world), item.id]))} alt="" className={`px-art ${big ? 'w-[min(300px,80vw)]' : 'w-[240px]'} rounded-2xl`} />;
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

/**
 * Step 2 (rebuilt 2026-11-27): no more gift box. The thing you bought materialises in its real
 * place (the room builds it up from the floor, a ride drives into the garage, new parts are
 * scanned onto the car) and this small banner says what you got, how rare it is and the XP back.
 * It never covers the scene, closes by itself and can be tapped away.
 */
export function PurchaseToast({ item, onDone }: { item: (Buyable & { key: number }) | null; onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (!item) return;
    setLeaving(false);
    buzz([20, 40, 30]);
    const t1 = setTimeout(() => setLeaving(true), reducedMotion() ? 3200 : 2900);
    const t2 = setTimeout(onDone, 3300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.key]);
  if (!item) return null;
  const kind = kindOf(item.id);
  const rarity = rarityOf(item);
  const color = RARITY_COLOR[rarity];
  const xp = Math.round(item.coins * BUY_XP_SHARE);
  return createPortal(
    <div className="fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[86] flex justify-center px-4 pointer-events-none">
      <button
        key={item.key}
        onClick={onDone}
        role="status"
        aria-live="polite"
        className={`buy-toast theme-dark pointer-events-auto flex items-center gap-3 rounded-2xl pl-2 pr-3.5 py-2 text-left ${leaving ? 'is-leaving' : ''} is-${rarity}`}
        style={{ ['--rc' as string]: color }}
      >
        <span className="buy-toast-icon shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[#fff]">
          <Icon name="✓" size={20} strokeWidth={3} />
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="px-label text-[9px]" style={{ color }}>{RARITY_LABEL[rarity]}</span>
            <span className="px-label text-[9px] text-slate-400">{LABEL[kind].tag}</span>
          </span>
          <span className="block font-display text-[16px] font-semibold text-[#fff] leading-tight truncate max-w-[200px]">{item.name}</span>
          <span className="block text-[11px] text-slate-400">{LABEL[kind].done}</span>
        </span>
        {xp > 0 && <span className="shrink-0 num-px text-[18px] text-emerald-300">+{xp} XP</span>}
      </button>
    </div>,
    document.body,
  );
}
