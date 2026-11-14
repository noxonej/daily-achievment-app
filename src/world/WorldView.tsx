import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { Segmented } from '../components/Segmented';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { InfoTip } from '../components/Guide';
import { Avatar } from '../components/Avatar';
import { Coin } from '../components/Coin';
import { Icon } from '../components/Icon';
import { useCountUp } from '../lib/useCountUp';
import type { CarMods, DecorSlot, DerivedStats, WorldState } from '../lib/types';
import {
  DECOR,
  DECOR_SLOTS,
  GARAGE_SPOTS,
  PAINTS,
  PARTS,
  PROPERTIES,
  RARITY_COLOR,
  VEHICLES,
  canFit,
  canUnlock,
  decorFor,
  garageSpots,
  owns,
  ownsDecor,
  ownedVehicles,
  partsOf,
  vehicleHex,
  worldOf,
  type DecorItem,
  type Part,
  type Unlock,
  type Vehicle,
} from './catalog';
import { CLASS_LABEL, type CarClass } from './cars/spec';
import { RIMS } from './cars/CarArt';
import { Room, RoomDefs, SlotArt, windowRect, type TimeOfDay } from './room/Room';
import { VehicleDraw } from './VehicleDraw';

type Section = 'room' | 'garage' | 'homes';

interface Pending {
  id: string;
  name: string;
  coins: number;
  vehicleId?: string;
}

/**
 * World (rebuilt 2026-11-14): the life you build alongside your real one.
 * Room: a wide room you drag around and tap to change, lit by the real time of day.
 * Garage: a showroom for a 300-car collection plus bikes, with wheels, spoilers, kits and paint.
 * Homes: move up as you grow.
 */
export function WorldView() {
  const { stats, dispatch } = useApp();
  const [section, setSection] = useState<Section>('room');
  const [pending, setPending] = useState<Pending | null>(null);
  const [bought, setBought] = useState<{ id: string; key: number } | null>(null);
  const coins = useCountUp(stats.availableShards, 700);

  function confirm(p: Pending) {
    dispatch({ type: 'WORLD_BUY', id: p.id, vehicleId: p.vehicleId });
    setBought({ id: p.id, key: Date.now() });
  }
  function buy(p: Pending) {
    if (p.coins === 0) confirm(p);
    else setPending(p);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 stagger">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">Your world</p>
          <h1 className="font-display text-[30px] leading-tight font-medium tracking-tight text-white mt-1 flex items-center gap-1">
            World
            <InfoTip
              title="Build your life here"
              text="Every quest you finish in real life gives coins and XP. Spend them here on your room, your cars and bigger homes. The best things also need a real milestone, like a 30-day streak, so they can only be earned. Nothing you own is ever taken away."
            />
          </h1>
        </div>
        <span className="shrink-0 flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5" aria-label={`${stats.availableShards} coins`}>
          <Coin size={16} />
          <span className="font-display text-[17px] tabular-nums text-white">{coins.toLocaleString()}</span>
        </span>
      </div>

      <Segmented
        value={section}
        onChange={setSection}
        options={[
          { id: 'room', label: 'Room', icon: '🏠' },
          { id: 'garage', label: 'Garage', icon: '🚗' },
          { id: 'homes', label: 'Homes', icon: '🏢' },
        ]}
      />

      <div key={section} className="animate-view-right space-y-4">
        {section === 'room' && <RoomSection stats={stats} onBuy={buy} bought={bought} />}
        {section === 'garage' && <GarageSection stats={stats} onBuy={buy} bought={bought} />}
        {section === 'homes' && <HomesSection stats={stats} onBuy={buy} />}
      </div>

      <ConfirmDialog
        open={!!pending}
        title={pending ? `Get ${pending.name}?` : ''}
        message={pending ? `This costs ${pending.coins.toLocaleString()} coins. You'll have ${(stats.availableShards - pending.coins).toLocaleString()} left. You keep it for good.` : ''}
        confirmLabel={pending ? `Get it · ${pending.coins.toLocaleString()} coins` : 'Get it'}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) confirm(pending);
          setPending(null);
        }}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- room */

const TIMES: Array<{ id: TimeOfDay | undefined; label: string; icon: string }> = [
  { id: undefined, label: 'Now', icon: '🌅' },
  { id: 'day', label: 'Day', icon: '☀️' },
  { id: 'dusk', label: 'Dusk', icon: '🌅' },
  { id: 'night', label: 'Night', icon: '🌙' },
];

function RoomSection({ stats, onBuy, bought }: { stats: DerivedStats; onBuy: (p: Pending) => void; bought: { id: string; key: number } | null }) {
  const { state, dispatch } = useApp();
  const world = worldOf(state);
  const [slot, setSlot] = useState<DecorSlot | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [placed, setPlaced] = useState<{ slot: DecorSlot; key: number } | null>(null);
  const [timeIx, setTimeIx] = useState(0);
  const time = TIMES[timeIx];
  const preview = previewId ? DECOR.find((d) => d.id === previewId) ?? null : null;
  const sceneWorld: WorldState = preview ? { ...world, decor: { ...world.decor, [preview.slot]: preview.id } } : world;
  const property = PROPERTIES.find((p) => p.id === world.property) ?? PROPERTIES[0];
  const books = useMemo(() => state.goals.filter((g) => g.kind === 'books').reduce((n, g) => n + (g.log?.length ?? 0), 0), [state.goals]);
  const trophies = state.unlockedAchievements.length;
  const items = slot ? DECOR.filter((d) => d.slot === slot) : [];
  const current = slot ? decorFor(world, slot) : null;
  const slotInfo = slot ? DECOR_SLOTS.find((s) => s.id === slot) : null;
  // A fresh purchase drops into the room the same way placing does.
  const boughtDecor = bought ? DECOR.find((d) => d.id === bought.id) : null;
  const dropped = placed ?? (boughtDecor ? { slot: boughtDecor.slot, key: bought!.key } : null);

  function pick(s: DecorSlot | null) {
    setSlot(s);
    setPreviewId(null);
  }

  return (
    <>
      <div className="relative world-scene-in h-[min(92vw,420px)]">
        <Room world={sceneWorld} trophies={trophies} books={books} focus={slot} onTapSlot={(s) => pick(slot === s ? null : s)} editing={!slot} dropped={dropped} time={time.id}>
          <Avatar look={state.character} size={200} bare alive className="w-full h-auto world-idle" />
        </Room>
        <div className="theme-dark pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {slot ? (
            <button onClick={() => pick(null)} className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-md pl-2.5 pr-3.5 py-1.5 text-[13px] font-semibold text-white">
              <Icon name="↩" size={14} />
              Whole room
            </button>
          ) : (
            <span className="flex items-center gap-2 rounded-full bg-black/45 backdrop-blur-md pl-3 pr-3.5 py-1.5">
              <span className="text-[11px] font-bold text-white/70 tabular-nums">{property.tier}/7</span>
              <span className="text-[13px] font-semibold text-white">{property.name}</span>
            </span>
          )}
          <div className="flex items-center gap-2">
            {preview && (
              <button key={preview.id} onClick={() => setPreviewId(null)} className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-amber-500 pl-3 pr-2.5 py-1.5 text-[12px] font-semibold text-[#fff] toast-in-up" aria-label={`Stop trying ${preview.name}`}>
                Trying
                <Icon name="✕" size={13} />
              </button>
            )}
            <button
              onClick={() => setTimeIx((timeIx + 1) % TIMES.length)}
              className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur-md px-3 py-1.5 text-[12px] font-semibold text-white"
              aria-label={`Light: ${time.label}. Tap to change`}
            >
              <Icon name={time.icon} size={13} />
              {time.label}
            </button>
          </div>
        </div>
      </div>

      {!slot && <p className="text-[13px] text-slate-400 -mt-1">Drag to look around. Tap anything in your room to change it. At night your room is lit only by the lamps, lights and screens you own.</p>}

      <div className="-mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
        {DECOR_SLOTS.map((s) => (
          <button
            key={s.id}
            onClick={() => pick(slot === s.id ? null : s.id)}
            aria-pressed={slot === s.id}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition ${slot === s.id ? 'seg-pill seg-on' : 'bg-white/[0.05] text-slate-300 hover:bg-white/10'}`}
          >
            <Icon name={s.icon} size={15} />
            {s.label}
          </button>
        ))}
      </div>

      {slot && slotInfo && (
        <div key={slot} className="sheet-up">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">{slotInfo.label} · {items.filter((i) => ownsDecor(world, i)).length}/{items.length} owned</p>
            <button onClick={() => pick(null)} className="text-xs font-semibold text-slate-400 hover:text-white">
              Done
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 min-[520px]:grid-cols-3 gap-2 rows-stagger">
            {items.map((item) => {
              const have = ownsDecor(world, item);
              const on = current?.id === item.id;
              const trying = previewId === item.id;
              const gate = canUnlock(item.unlock, stats);
              return (
                <div key={item.id} className={`rounded-[20px] p-2.5 transition-shadow ${on ? 'world-home-here' : trying ? 'bg-white/[0.06] ring-1 ring-white/40' : 'bg-white/[0.035]'}`}>
                  <button
                    onClick={() => (have ? !on && place(item) : setPreviewId(trying ? null : item.id))}
                    className="block w-full rounded-2xl overflow-hidden"
                    aria-label={have ? `Place ${item.name}` : `Try ${item.name} in your room`}
                  >
                    <Thumb item={item} tier={property.tier} trophies={trophies} books={books} locked={!have && !gate.ok} />
                  </button>
                  <p className="mt-2 text-[13px] font-semibold text-white leading-tight">{item.name}</p>
                  {item.blurb && <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{item.blurb}</p>}
                  {!have && <Requirements unlock={item.unlock} stats={stats} compact />}
                  <div className="mt-2 flex gap-1.5">
                    {on ? (
                      <span className="text-xs font-bold text-[var(--mood)]">In your room</span>
                    ) : have ? (
                      <button onClick={() => place(item)} className="w-full rounded-full bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
                        Place
                      </button>
                    ) : (
                      <>
                        {!trying && !item.unlock.chest && (
                          <button onClick={() => setPreviewId(item.id)} className="shrink-0 rounded-full bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-slate-200">
                            Try
                          </button>
                        )}
                        <BuyButton gate={gate} coins={item.unlock.coins} small onClick={() => onBuy({ id: item.id, name: item.name, coins: item.unlock.coins })} verb="Get" />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  function place(item: DecorItem) {
    dispatch({ type: 'WORLD_PLACE', slot: item.slot, itemId: item.id });
    setPreviewId(null);
    setPlaced({ slot: item.slot, key: Date.now() });
  }
}

/** A close-up of one item, drawn with the same art as the room. */
function Thumb({ item, tier, trophies, books, locked }: { item: DecorItem; tier: number; trophies: number; books: number; locked: boolean }) {
  const rect = DECOR_SLOTS.find((s) => s.id === item.slot)?.rect;
  if (item.slot === 'wall' || item.slot === 'floor' || !rect) {
    return (
      <div className="aspect-[4/3] w-full" style={{ background: `linear-gradient(160deg, ${item.color ?? '#888'}, color-mix(in srgb, ${item.color ?? '#888'} 70%, #000))` }}>
        <div className="w-full h-full" style={{ background: item.slot === 'floor' ? 'repeating-linear-gradient(90deg, transparent 0 22px, rgba(0,0,0,.12) 22px 24px)' : 'linear-gradient(180deg, transparent 70%, rgba(0,0,0,.18))' }} />
      </div>
    );
  }
  const win = windowRect(tier);
  let [x, y, w, h] = rect;
  if (item.slot === 'window') [x, y, w, h] = [win.x - 40, win.y - 30, win.w + 80, win.h + 70];
  // Pad to a 4:3 box so every card lines up.
  const pad = 14;
  let vw = w + pad * 2;
  let vh = h + pad * 2;
  if (vw / vh > 4 / 3) vh = (vw * 3) / 4;
  else vw = (vh * 4) / 3;
  const vx = x + w / 2 - vw / 2;
  const vy = y + h / 2 - vh / 2;
  const empty = item.model === 'none';
  return (
    <div className="car-tile aspect-[4/3] w-full relative">
      {empty ? (
        <span className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold text-white/50">Leave empty</span>
      ) : (
        <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} className={`w-full h-full ${locked ? 'car-card-lock' : ''}`} aria-hidden="true">
          <RoomDefs />
          {item.slot === 'window' && <rect x={win.x} y={win.y} width={win.w} height={win.h} fill="#9cc9ea" />}
          <SlotArt item={item} night={false} trophies={trophies} books={books} win={win} />
        </svg>
      )}
      {locked && (
        <span className="absolute right-1.5 top-1.5 w-6 h-6 rounded-full bg-black/55 flex items-center justify-center text-white/80">
          <Icon name="🔒" size={12} />
        </span>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- garage */

type Filter = 'all' | 'owned' | 'bikes' | CarClass;
const PAGE = 24;
const PART_TABS: Array<{ id: keyof CarMods | 'paint'; label: string }> = [
  { id: 'paint', label: 'Paint' },
  { id: 'rim', label: 'Wheels' },
  { id: 'spoiler', label: 'Spoiler' },
  { id: 'kit', label: 'Body kit' },
  { id: 'stance', label: 'Height' },
];
const BIKE_KINDS = ['bike', 'scooter', 'racebike', 'moto'];

function GarageSection({ stats, onBuy, bought }: { stats: DerivedStats; onBuy: (p: Pending) => void; bought: { id: string; key: number } | null }) {
  const { state, dispatch } = useApp();
  const world = worldOf(state);
  const owned = ownedVehicles(world);
  const spots = garageSpots(world);
  const full = owned.length >= spots;
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [shown, setShown] = useState(PAGE);
  const [tab, setTab] = useState<(typeof PART_TABS)[number]['id']>('paint');
  const [tryPart, setTryPart] = useState<Part | null>(null);
  const [tryPaint, setTryPaint] = useState<string | null>(null);

  const featured = VEHICLES.find((v) => v.id === world.vehicle && owns(world, v.id)) ?? owned[0] ?? VEHICLES[0];
  const stage = (inspectId && VEHICLES.find((v) => v.id === inspectId)) || featured;
  const have = owns(world, stage.id);
  const isBike = !stage.car;
  const parts: Required<CarMods> = { ...partsOf(world, stage), ...(tryPart ? { [tryPart.kind]: tryPart.value } : {}) };
  const hex = tryPaint ?? vehicleHex(world, stage);
  const gate = canUnlock(stage.unlock, stats);

  const classes = useMemo(() => {
    const seen = new Set<CarClass>();
    for (const v of VEHICLES) if (v.car && v.car.maker !== 'Squzo') seen.add(v.car.cls);
    return [...seen];
  }, []);
  const list = useMemo(() => {
    const l = VEHICLES.filter((v) =>
      filter === 'all' ? true : filter === 'owned' ? owns(world, v.id) : filter === 'bikes' ? BIKE_KINDS.includes(v.kind) : v.car?.cls === filter,
    );
    // Owned first, then what you can get soon.
    const rank = (v: Vehicle) => (owns(world, v.id) ? 0 : v.unlock.chest ? 2 : 1);
    return [...l].sort((a, b) => rank(a) - rank(b) || a.unlock.level - b.unlock.level || a.unlock.coins - b.unlock.coins);
  }, [filter, world]);
  const carsOwned = owned.filter((v) => v.car).length;
  const carsTotal = VEHICLES.filter((v) => v.car).length;

  function inspect(v: Vehicle) {
    setInspectId(v.id === featured.id ? null : v.id);
    setTryPart(null);
    setTryPaint(null);
    if (!v.car && tab !== 'paint') setTab('paint');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const nextSpot = GARAGE_SPOTS.find((g) => !(g.id in world.paid));
  const tabParts = tab === 'paint' ? [] : PARTS.filter((p) => p.kind === tab);

  return (
    <>
      {/* showroom */}
      <div className="show-stage theme-dark relative overflow-hidden rounded-[28px] aspect-[4/3] world-scene-in">
        <div className="show-cone" aria-hidden="true" />
        <div className="show-floor" aria-hidden="true" />
        {/* Cars keep their real proportions: an SUV stands taller than a hypercar. */}
        <div key={stage.id} className={`absolute inset-x-0 bottom-[18%] flex justify-center show-in ${isBike ? 'h-[40%]' : 'h-[50%]'}`}>
          <div key={hex + JSON.stringify(parts) + (bought?.key ?? '')} className="show-swap h-full flex items-end justify-center">
            <VehicleDraw vehicle={stage} hex={hex} parts={parts} spin className="h-full w-auto max-w-[94%]" />
          </div>
        </div>
        <div className="absolute left-4 top-4 right-4 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#15110e]" style={{ background: RARITY_COLOR[stage.rarity] }}>
              {stage.rarity}
              {stage.car && stage.car.maker !== 'Squzo' ? ` · ${CLASS_LABEL[stage.car.cls]}` : ''}
            </span>
            <p className="mt-1.5 font-display text-[22px] font-medium text-white leading-tight">{stage.car && stage.car.maker !== 'Squzo' ? stage.car.model : stage.name}</p>
            <p className="text-[12px] text-white/60">{stage.car && stage.car.maker !== 'Squzo' ? stage.car.maker : stage.car ? 'Squzo original' : 'Two wheels'}</p>
          </div>
          <span className="shrink-0 rounded-full bg-black/45 backdrop-blur-md px-3 py-1.5 text-[12px] font-semibold text-white tabular-nums">
            {owned.length}/{spots === Infinity ? '∞' : spots} spots
          </span>
        </div>
        {stage.car && stage.car.hp > 0 && (
          <div className="absolute left-4 right-4 bottom-3 grid grid-cols-3 gap-2 text-center">
            {[
              [`${stage.car.hp}`, 'hp'],
              [`${stage.car.zeroTo100}s`, '0–100'],
              [`${stage.car.top}`, 'km/h'],
            ].map(([v, l]) => (
              <div key={l} className="rounded-xl bg-black/35 backdrop-blur-sm py-1">
                <p className="font-display text-[15px] text-white tabular-nums leading-tight">{v}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/50">{l}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* what you can do with the car on stage */}
      {!have ? (
        <div className="rounded-[24px] bg-white/[0.035] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-white">{stage.name}</p>
              <Requirements unlock={stage.unlock} stats={stats} />
            </div>
            <button onClick={() => setInspectId(null)} className="shrink-0 text-xs font-semibold text-slate-400 hover:text-white">
              Back to yours
            </button>
          </div>
          <div className="mt-3">
            {full && gate.ok ? (
              <p className="text-[12px] text-slate-400">Your garage is full. Build more space below.</p>
            ) : (
              <BuyButton gate={gate} coins={stage.unlock.coins} onClick={() => onBuy({ id: stage.id, name: stage.name, coins: stage.unlock.coins })} verb="Get this car" />
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Customise</p>
            {stage.id !== featured.id ? (
              <button onClick={() => { dispatch({ type: 'WORLD_FEATURE', vehicleId: stage.id }); setInspectId(null); }} className="text-xs font-semibold text-[var(--mood)]">
                Put in the spotlight
              </button>
            ) : (
              <span className="text-xs font-semibold text-slate-500">In the spotlight</span>
            )}
          </div>
          {!isBike && (
            <div className="mt-2 -mx-4 px-4 flex gap-1.5 overflow-x-auto no-scrollbar">
              {PART_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setTryPart(null); setTryPaint(null); }}
                  aria-pressed={tab === t.id}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold ${tab === t.id ? 'seg-pill seg-on' : 'bg-white/[0.05] text-slate-300'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          {tab === 'paint' || isBike ? (
            <div className="mt-2.5 -mx-4 px-4 flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
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
                    className="shrink-0 w-[62px] flex flex-col items-center gap-1"
                  >
                    <span className={`relative w-11 h-11 rounded-full transition-transform ${on ? 'ring-2 ring-white ring-offset-2 ring-offset-canvas scale-105' : ''} ${!mine && !g.ok ? 'opacity-35' : ''}`} style={{ background: `radial-gradient(circle at 35% 30%, #ffffff66, transparent 45%), ${p.hex}` }}>
                      {!mine && (
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-canvas flex items-center justify-center text-slate-300">
                          <Icon name={g.ok ? 'coin' : '🔒'} size={11} />
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight text-center truncate w-full">{mine ? p.name : g.ok ? p.unlock.coins : `LV ${p.unlock.level}`}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-2.5 grid grid-cols-3 min-[480px]:grid-cols-4 gap-2">
              {tabParts.map((p) => {
                const fits = canFit(world, stage, p);
                const on = parts[p.kind] === p.value;
                const g = canUnlock(p.unlock, stats);
                const label = p.kind === 'rim' ? RIMS.find((r) => r.id === p.value)?.name ?? p.name : p.name;
                return (
                  <button
                    key={p.id}
                    onClick={() => (fits ? (setTryPart(null), dispatch({ type: 'WORLD_MOD', vehicleId: stage.id, partId: p.id })) : setTryPart(tryPart?.id === p.id ? null : p))}
                    aria-pressed={on}
                    className={`rounded-2xl p-2 text-left transition ${on ? 'world-home-here' : 'bg-white/[0.035] hover:bg-white/[0.06]'}`}
                  >
                    <p className={`text-[12px] font-semibold leading-tight ${fits || g.ok ? 'text-white' : 'text-slate-500'}`}>{label}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400 flex items-center gap-1">
                      {fits ? (on ? 'Fitted' : 'Yours') : g.ok ? <><Coin size={10} /> {p.unlock.coins.toLocaleString()}</> : <><Icon name="🔒" size={9} /> {g.text}</>}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
          {(tryPart || tryPaint) && (() => {
            const item = tryPart ?? PAINTS.find((p) => p.hex === tryPaint)!;
            const g = canUnlock(item.unlock, stats);
            const name = tryPart ? tryPart.name : `${(item as (typeof PAINTS)[number]).name} paint`;
            return (
              <div className="mt-3 rounded-[20px] bg-white/[0.05] p-3 flex items-center gap-3 toast-in-up">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white">Trying {name}</p>
                  <Requirements unlock={item.unlock} stats={stats} compact />
                </div>
                <BuyButton gate={g} coins={item.unlock.coins} small onClick={() => { onBuy({ id: item.id, name, coins: item.unlock.coins, vehicleId: stage.id }); setTryPart(null); setTryPaint(null); }} verb="Get" />
              </div>
            );
          })()}
        </div>
      )}

      {/* the collection */}
      <div>
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Collection</p>
          <p className="text-[12px] font-semibold text-slate-400 tabular-nums">
            {carsOwned}/{carsTotal} cars
          </p>
        </div>
        <div className="mt-2 -mx-4 px-4 flex gap-1.5 overflow-x-auto no-scrollbar">
          {(['all', 'owned', 'bikes', ...classes] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setShown(PAGE); }}
              aria-pressed={filter === f}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold ${filter === f ? 'seg-pill seg-on' : 'bg-white/[0.05] text-slate-300'}`}
            >
              {f === 'all' ? 'All' : f === 'owned' ? 'Yours' : f === 'bikes' ? 'Bikes' : CLASS_LABEL[f]}
            </button>
          ))}
        </div>
        <div className="mt-2.5 grid grid-cols-2 min-[520px]:grid-cols-3 gap-2.5">
          {list.slice(0, shown).map((v) => {
            const mine = owns(world, v.id);
            const on = v.id === stage.id;
            const g = canUnlock(v.unlock, stats);
            return (
              <button key={v.id} onClick={() => inspect(v)} className={`relative rounded-[20px] p-2.5 text-left ${on ? 'world-home-here' : 'bg-white/[0.035] hover:bg-white/[0.06]'}`} aria-label={`Look at ${v.name}`}>
                <div className="car-tile rounded-2xl px-1 pt-2 pb-1">
                  <VehicleDraw vehicle={v} hex={vehicleHex(world, v)} parts={partsOf(world, v)} className={`w-full h-auto ${mine ? '' : 'car-card-lock'} ${v.car ? '' : 'px-5'}`} />
                </div>
                <p className="mt-1.5 text-[12px] font-semibold text-white leading-tight truncate">{v.car && v.car.maker !== 'Squzo' ? v.car.model : v.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{v.car && v.car.maker !== 'Squzo' ? v.car.maker : BIKE_KINDS.includes(v.kind) ? 'Two wheels' : 'Squzo original'}</p>
                <p className="mt-1 flex items-center gap-1 text-[10px] font-bold" style={{ color: RARITY_COLOR[v.rarity] }}>
                  {mine ? 'Yours' : v.unlock.chest ? 'Chest only' : g.ok ? <><Coin size={10} /> <span className="text-slate-200 tabular-nums">{v.unlock.coins.toLocaleString()}</span></> : <span className="text-slate-500">Level {v.unlock.level}</span>}
                </p>
              </button>
            );
          })}
        </div>
        {list.length > shown && (
          <button onClick={() => setShown(shown + PAGE)} className="mt-3 w-full rounded-full bg-white/[0.06] hover:bg-white/10 py-2.5 text-sm font-semibold text-white">
            Show more ({list.length - shown} left)
          </button>
        )}
      </div>

      {nextSpot && (
        <div className="rounded-[24px] bg-white/[0.035] p-4 flex items-center gap-3">
          <span className="shrink-0 w-11 h-11 rounded-2xl bg-white/[0.06] text-slate-300 flex items-center justify-center">
            <Icon name="＋" size={20} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white">{nextSpot.label ?? 'Bigger garage'}</p>
            <p className="text-[13px] text-slate-400">{nextSpot.label ? 'More room for your collection.' : `Room for one more vehicle (${spots + 1} spots).`}</p>
            <Requirements unlock={nextSpot.unlock} stats={stats} />
          </div>
          <BuyButton gate={canUnlock(nextSpot.unlock, stats)} coins={nextSpot.unlock.coins} small onClick={() => onBuy({ id: nextSpot.id, name: nextSpot.label?.toLowerCase() ?? 'a bigger garage', coins: nextSpot.unlock.coins })} verb="Build" />
        </div>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- homes */

function HomesSection({ stats, onBuy }: { stats: DerivedStats; onBuy: (p: Pending) => void }) {
  const { state, dispatch } = useApp();
  const world = worldOf(state);
  return (
    <div>
      <p className="text-[13px] text-slate-400">Each home has bigger windows, a better view and nicer light, and comes with its own walls and floor.</p>
      <div className="mt-3 space-y-2.5 rows-stagger">
        {PROPERTIES.map((p) => {
          const owned = owns(world, p.id);
          const here = world.property === p.id;
          const gate = canUnlock(p.unlock, stats);
          return (
            <div key={p.id} className={`relative overflow-hidden rounded-[24px] p-4 ${here ? 'world-home-here' : 'bg-white/[0.035]'}`}>
              <div className="flex items-start gap-3">
                <span className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center font-display text-lg ${owned ? 'bg-amber-500 text-[#fff]' : 'bg-white/[0.06] text-slate-400'}`}>{p.tier}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{p.name}</p>
                  <p className="text-[13px] text-slate-400 leading-snug">{p.blurb}</p>
                  {!owned && <Requirements unlock={p.unlock} stats={stats} />}
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                {here ? (
                  <span className="text-xs font-bold text-[var(--mood)]">You live here</span>
                ) : owned ? (
                  <button onClick={() => dispatch({ type: 'WORLD_MOVE', property: p.id })} className="rounded-full bg-white/10 hover:bg-white/15 px-4 py-2 text-sm font-semibold text-white">
                    Live here
                  </button>
                ) : (
                  <BuyButton gate={gate} coins={p.unlock.coins} onClick={() => onBuy({ id: p.id, name: p.name, coins: p.unlock.coins })} verb="Move in" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- shared bits */

function Requirements({ unlock, stats, compact = false }: { unlock: Unlock; stats: DerivedStats; compact?: boolean }) {
  if (unlock.chest) {
    return (
      <ul className={`mt-2 flex flex-wrap gap-1.5 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
        <li className="flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold bg-violet-500/15 text-violet-200">
          <Icon name="df:chest" size={10} />
          Chest drop only
        </li>
      </ul>
    );
  }
  const rows: Array<{ ok: boolean; text: string }> = [{ ok: stats.level >= unlock.level, text: `Level ${unlock.level}` }];
  if (unlock.milestone) rows.push({ ok: stats[unlock.milestone.stat] >= unlock.milestone.target, text: unlock.milestone.label });
  if (unlock.coins > 0) rows.push({ ok: stats.availableShards >= unlock.coins, text: `${unlock.coins.toLocaleString()} coins` });
  return (
    <ul className={`mt-2 flex flex-wrap gap-1.5 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
      {rows.map((r) => (
        <li key={r.text} className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${r.ok ? 'bg-emerald-400/10 text-emerald-200' : 'bg-white/[0.06] text-slate-400'}`}>
          <Icon name={r.ok ? '✓' : '🔒'} size={10} />
          {r.text}
        </li>
      ))}
    </ul>
  );
}

function BuyButton({ gate, coins, onClick, verb, small = false }: { gate: ReturnType<typeof canUnlock>; coins: number; onClick: () => void; verb: string; small?: boolean }) {
  // Locked: the requirement list already says what's missing.
  if (!gate.ok) return null;
  return (
    <button onClick={onClick} className={`pill-light ${small ? 'w-full px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}>
      {verb}
      {coins > 0 && (
        <span className="flex items-center gap-1 tabular-nums">
          · <Coin size={12} /> {coins.toLocaleString()}
        </span>
      )}
    </button>
  );
}
