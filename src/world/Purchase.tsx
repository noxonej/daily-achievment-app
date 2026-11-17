import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../store/AppContext';
import { useBackToClose } from '../lib/backstack';
import { BUY_XP_SHARE } from '../lib/xp';
import { Coin } from '../components/Coin';
import { Confetti } from '../components/Confetti';
import { Icon } from '../components/Icon';
import { OpenBurst, PrizeHalo, StageLight } from '../components/fx/RewardFx';
import { Gift } from '../components/fx/Gift';
import { VehicleDraw } from './VehicleDraw';
import { HomeThumb } from './room/Room';
import { garageSceneUrl } from './px/garage';
import { DECOR, GARAGE_ENVS, PAINTS, PARTS, PROPERTIES, VEHICLES, partsOf, vehicleHex, worldOf, type Vehicle } from './catalog';

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
  if (GARAGE_ENVS.some((g) => g.id === id)) return 'garage';
  if (PAINTS.some((p) => p.id === id) || PARTS.some((p) => p.id === id)) return 'upgrade';
  return 'decor';
}

const LABEL: Record<Kind, { tag: string; done: string; color: string }> = {
  vehicle: { tag: 'New ride', done: 'It’s yours. Time for a drive.', color: '#7cc7ff' },
  home: { tag: 'New home', done: 'Welcome home.', color: '#fcd34d' },
  decor: { tag: 'For your room', done: 'Unboxed and placed in your room.', color: '#f9a8d4' },
  upgrade: { tag: 'Upgrade', done: 'Fitted. Looking sharp.', color: '#a3e635' },
  garage: { tag: 'New garage', done: 'Your cars just moved in.', color: '#c4b5fd' },
};

/** The thing itself, drawn the way the game draws it. */
export function BuyArt({ item, decorThumb, big = false }: { item: Buyable; decorThumb?: (id: string) => ReactNode; big?: boolean }) {
  const { state } = useApp();
  const world = worldOf(state);
  const kind = kindOf(item.id);
  if (kind === 'vehicle') {
    const v = VEHICLES.find((x) => x.id === item.id)!;
    return <VehicleDraw vehicle={v} hex={vehicleHex(world, v)} parts={partsOf(world, v)} className={big ? 'w-[280px]' : 'w-[220px]'} />;
  }
  if (kind === 'upgrade') {
    const v: Vehicle | undefined = VEHICLES.find((x) => x.id === item.vehicleId);
    if (!v) return null;
    const paint = PAINTS.find((p) => p.id === item.id);
    const part = PARTS.find((p) => p.id === item.id);
    return <VehicleDraw vehicle={v} hex={paint?.hex ?? vehicleHex(world, v)} parts={{ ...partsOf(world, v), ...(part ? { [part.kind]: part.value } : {}) }} className={big ? 'w-[280px]' : 'w-[220px]'} />;
  }
  if (kind === 'home') return <HomeThumb id={item.id} className={`${big ? 'w-[300px]' : 'w-[240px]'} aspect-[16/10] rounded-2xl`} />;
  if (kind === 'garage') return <img src={garageSceneUrl(item.id, new Set())} alt="" className={`px-art ${big ? 'w-[300px]' : 'w-[240px]'} rounded-2xl`} />;
  const d = DECOR.find((x) => x.id === item.id);
  return d && decorThumb ? <div className={big ? 'w-[220px]' : 'w-[180px]'}>{decorThumb(d.id)}</div> : null;
}

/** Step 1: the shop sheet. Hold to buy. */
export function PurchaseSheet({ item, balance, onCancel, onBuy, decorThumb }: { item: Buyable | null; balance: number; onCancel: () => void; onBuy: () => void; decorThumb?: (id: string) => ReactNode }) {
  const [hold, setHold] = useState(0);
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
  function down() {
    start.current = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start.current) / HOLD_MS);
      setHold(p);
      if (p >= 1) {
        try {
          navigator.vibrate?.(30);
        } catch {
          // optional
        }
        setHold(0);
        onBuy();
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }
  function up() {
    cancelAnimationFrame(raf.current);
    setHold(0);
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
          className="shop-buy relative mt-4 w-full overflow-hidden rounded-2xl py-4 text-[16px] font-bold text-[#1a1205] select-none touch-none"
          style={{ ['--hold' as string]: `${hold * 100}%` }}
        >
          <span className="relative z-[1] flex items-center justify-center gap-2">
            <Icon name="🛒" size={18} />
            {hold > 0 ? 'Keep holding…' : 'Hold to buy'}
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

/** Step 2: the moment you get it. Tap anywhere (or wait) to continue. */
export function PurchaseCelebration({ item, onDone, decorThumb }: { item: Buyable | null; onDone: () => void; decorThumb?: (id: string) => ReactNode }) {
  const [phase, setPhase] = useState<'in' | 'show'>('in');
  useBackToClose(!!item, onDone);
  useEffect(() => {
    if (!item) return;
    setPhase('in');
    const t = setTimeout(() => setPhase('show'), 900);
    const auto = setTimeout(onDone, 4200);
    return () => {
      clearTimeout(t);
      clearTimeout(auto);
    };
  }, [item, onDone]);
  if (!item) return null;
  const kind = kindOf(item.id);
  const label = LABEL[kind];
  const xp = Math.round(item.coins * BUY_XP_SHARE);

  return createPortal(
    <div data-overlay className="theme-dark box-stage fixed inset-0 z-[86] flex flex-col items-center justify-center px-6 backdrop-in" onClick={onDone}>
      <StageLight tint={label.color} lit={phase === 'show'} />
      <span className="box-stage-floor" aria-hidden="true" />
      {phase === 'show' && <Confetti count={40} />}
      <div className="relative flex flex-col items-center">
        {kind === 'decor' && phase === 'in' ? (
          <div className="relative">
            <Gift size={180} phase="shake" />
          </div>
        ) : (
          <div className={`relative ${kind === 'vehicle' ? (phase === 'in' ? 'buy-drive-in' : 'buy-settle') : kind === 'home' ? 'buy-door' : kind === 'upgrade' ? 'buy-sparkle' : 'animate-prize-in'}`}>
            {phase === 'show' && <PrizeHalo color={label.color} big />}
            {phase === 'show' && kind === 'decor' && <OpenBurst color={label.color} coins={8} />}
            <div className="relative">
              <BuyArt item={item} decorThumb={decorThumb} big />
            </div>
          </div>
        )}
        <p className={`mt-6 px-label text-[11px] transition-opacity duration-300 ${phase === 'show' ? 'opacity-100' : 'opacity-0'}`} style={{ color: label.color }}>
          {label.tag}
        </p>
        <p className={`mt-2 font-display text-[28px] font-semibold text-[#fff] text-center transition-opacity duration-300 ${phase === 'show' ? 'opacity-100' : 'opacity-0'}`}>{item.name}</p>
        <p className={`mt-1 text-[14px] text-slate-300 transition-opacity duration-300 ${phase === 'show' ? 'opacity-100' : 'opacity-0'}`}>{label.done}</p>
        {xp > 0 && (
          <span className={`mt-4 rounded-full bg-emerald-400/15 px-3 py-1.5 text-emerald-200 transition-all duration-500 ${phase === 'show' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <span className="num-px text-[20px]">+{xp} XP</span>
          </span>
        )}
        <p className={`mt-8 text-[12px] text-slate-500 transition-opacity duration-300 ${phase === 'show' ? 'opacity-100' : 'opacity-0'}`}>Tap to continue</p>
      </div>
    </div>,
    document.body,
  );
}
