import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { Segmented } from '../components/Segmented';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { InfoTip } from '../components/Guide';
import { Avatar } from '../components/Avatar';
import { Coin } from '../components/Coin';
import { Icon } from '../components/Icon';
import { useCountUp } from '../lib/useCountUp';
import type { DecorSlot, DerivedStats } from '../lib/types';
import {
  DECOR,
  DECOR_SLOTS,
  GARAGE_SPOTS,
  PAINTS,
  PROPERTIES,
  RARITY_COLOR,
  VEHICLES,
  canUnlock,
  decorFor,
  garageSpots,
  owns,
  ownsDecor,
  ownedVehicles,
  worldOf,
  type Unlock,
} from './catalog';
import { HomeScene } from './HomeScene';
import { VehicleArt } from './VehicleArt';

type Section = 'home' | 'garage';

interface Pending {
  id: string;
  name: string;
  coins: number;
  vehicleId?: string;
}

/**
 * World: the life you build alongside your real one. Your home (rooms you decorate, homes you
 * move up to) and your garage. Everything unlocks with level, coins and real milestones.
 */
export function WorldView() {
  const { stats, dispatch } = useApp();
  const [section, setSection] = useState<Section>('home');
  const [pending, setPending] = useState<Pending | null>(null);
  const coins = useCountUp(stats.availableShards, 700);

  function buy(p: Pending) {
    if (p.coins === 0) dispatch({ type: 'WORLD_BUY', id: p.id, vehicleId: p.vehicleId });
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
              text="Every quest you finish in real life gives coins and XP. Spend them here on your home, its furniture and your vehicles. The best things also need a real milestone, like a 30-day streak, so they can only be earned. Nothing you own is ever taken away."
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
          { id: 'home', label: 'Home', icon: '🏠' },
          { id: 'garage', label: 'Garage', icon: '🚗' },
        ]}
      />

      <div key={section} className="animate-view-right space-y-4">
        {section === 'home' ? <HomeSection stats={stats} onBuy={buy} /> : <GarageSection stats={stats} onBuy={buy} />}
      </div>

      <ConfirmDialog
        open={!!pending}
        title={pending ? `Get ${pending.name}?` : ''}
        message={pending ? `This costs ${pending.coins.toLocaleString()} coins. You'll have ${(stats.availableShards - pending.coins).toLocaleString()} left. You keep it for good.` : ''}
        confirmLabel={pending ? `Get it · ${pending.coins.toLocaleString()} coins` : 'Get it'}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) dispatch({ type: 'WORLD_BUY', id: pending.id, vehicleId: pending.vehicleId });
          setPending(null);
        }}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- home */

function HomeSection({ stats, onBuy }: { stats: DerivedStats; onBuy: (p: Pending) => void }) {
  const { state, dispatch } = useApp();
  const world = worldOf(state);
  const [slot, setSlot] = useState<DecorSlot | null>(null);
  const property = PROPERTIES.find((p) => p.id === world.property) ?? PROPERTIES[0];
  const books = useMemo(() => state.goals.filter((g) => g.kind === 'books').reduce((n, g) => n + (g.log?.length ?? 0), 0), [state.goals]);
  const trophies = state.unlockedAchievements.length;
  const items = slot ? DECOR.filter((d) => d.slot === slot) : [];
  const current = slot ? decorFor(world, slot) : null;

  return (
    <>
      <div className="relative world-scene-in">
        <HomeScene world={world} trophies={trophies} books={books} highlight={slot ?? undefined}>
          <Avatar look={state.character} size={200} bare className="w-full h-auto world-idle" />
        </HomeScene>
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/45 backdrop-blur-md pl-3 pr-3.5 py-1.5">
          <span className="text-[11px] font-bold text-white/70 tabular-nums">{property.tier}/7</span>
          <span className="text-[13px] font-semibold text-white">{property.name}</span>
        </div>
      </div>

      {/* decorate */}
      <div>
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Decorate</p>
          {slot && (
            <button onClick={() => setSlot(null)} className="text-xs font-semibold text-slate-400 hover:text-white">
              Done
            </button>
          )}
        </div>
        <div className="mt-2 -mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
          {DECOR_SLOTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSlot(slot === s.id ? null : s.id)}
              aria-pressed={slot === s.id}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                slot === s.id ? 'seg-pill seg-on' : 'bg-white/[0.05] text-slate-300 hover:bg-white/10'
              }`}
            >
              <Icon name={s.icon} size={15} />
              {s.label}
            </button>
          ))}
        </div>
        {slot && (
          <div className="mt-3 grid grid-cols-2 gap-2 rows-stagger">
            {items.map((item) => {
              const owned = ownsDecor(world, item);
              const placed = current?.id === item.id;
              return (
                <ItemCard
                  key={item.id}
                  name={item.name}
                  swatch={item.color}
                  unlock={item.unlock}
                  stats={stats}
                  owned={owned}
                  active={placed}
                  activeLabel="Placed"
                  ownedLabel="Place"
                  onUse={() => dispatch({ type: 'WORLD_PLACE', slot: item.slot, itemId: item.id })}
                  onBuy={() => onBuy({ id: item.id, name: item.name, coins: item.unlock.coins })}
                />
              );
            })}
          </div>
        )}
        {!slot && <p className="mt-2 text-[13px] text-slate-400">Pick a spot to change it. Your trophy shelf fills with the badges you earn, and the books you log under a reading goal appear on it too.</p>}
      </div>

      {/* homes */}
      <div>
        <p className="eyebrow">Move up</p>
        <div className="mt-2 space-y-2.5 rows-stagger">
          {PROPERTIES.map((p) => {
            const owned = owns(world, p.id);
            const here = world.property === p.id;
            const gate = canUnlock(p.unlock, stats);
            return (
              <div key={p.id} className={`relative overflow-hidden rounded-[24px] p-4 ${here ? 'world-home-here' : 'bg-white/[0.035]'}`}>
                <div className="flex items-start gap-3">
                  <span className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center font-display text-lg ${owned ? 'bg-[var(--mood)] text-[#15110e]' : 'bg-white/[0.06] text-slate-400'}`}>
                    {p.tier}
                  </span>
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
    </>
  );
}

/* ---------------------------------------------------------------- garage */

function GarageSection({ stats, onBuy }: { stats: DerivedStats; onBuy: (p: Pending) => void }) {
  const { state, dispatch } = useApp();
  const world = worldOf(state);
  const owned = ownedVehicles(world);
  const spots = garageSpots(world);
  const featured = VEHICLES.find((v) => v.id === world.vehicle && owns(world, v.id)) ?? owned[0] ?? VEHICLES[0];
  const paintId = world.paints?.[featured.id] ?? featured.paint;
  const paint = PAINTS.find((p) => p.id === paintId) ?? PAINTS[0];
  const full = owned.length >= spots;
  const nextSpot = GARAGE_SPOTS.find((g) => !(g.id in world.paid));

  return (
    <>
      <div className="garage-scene relative overflow-hidden rounded-[28px] aspect-[16/11] world-scene-in">
        <div className="absolute inset-x-0 top-0 h-full garage-beam" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-[34%] garage-floor" aria-hidden="true" />
        <div key={featured.id + paint.id} className={`absolute bottom-[13%] left-1/2 -translate-x-1/2 vehicle-in ${['bike', 'racebike', 'scooter'].includes(featured.kind) ? 'w-[62%]' : 'w-[84%]'}`}>
          <VehicleArt vehicle={featured} paint={paint.hex} spin className="w-full h-auto drop-shadow-[0_18px_20px_rgba(0,0,0,0.55)]" />
        </div>
        <div className="absolute left-4 top-4 right-4 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#15110e]" style={{ background: RARITY_COLOR[featured.rarity] }}>
              {featured.rarity}
            </span>
            <p className="mt-1.5 font-display text-[22px] font-medium text-white leading-tight">{featured.name}</p>
            <p className="text-[12px] text-white/60">{paint.name}</p>
          </div>
          <span className="shrink-0 rounded-full bg-black/45 backdrop-blur-md px-3 py-1.5 text-[12px] font-semibold text-white tabular-nums">
            {owned.length}/{spots} spots
          </span>
        </div>
      </div>

      {/* paint */}
      {owns(world, featured.id) && (
        <div>
          <p className="eyebrow">Paint</p>
          <div className="mt-2 -mx-4 px-4 flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {PAINTS.map((p) => {
              const have = owns(world, p.id);
              const on = p.id === paint.id;
              const gate = canUnlock(p.unlock, stats);
              return (
                <button
                  key={p.id}
                  onClick={() => (have ? dispatch({ type: 'WORLD_PAINT', vehicleId: featured.id, paint: p.id }) : gate.ok && onBuy({ id: p.id, name: `${p.name} paint`, coins: p.unlock.coins, vehicleId: featured.id }))}
                  aria-label={`${p.name}${have ? '' : gate.ok ? `, ${p.unlock.coins} coins` : `, locked: ${gate.text}`}`}
                  aria-pressed={on}
                  className="shrink-0 w-[62px] flex flex-col items-center gap-1"
                >
                  <span className={`relative w-11 h-11 rounded-full transition-transform ${on ? 'ring-2 ring-white ring-offset-2 ring-offset-canvas scale-105' : ''} ${!have && !gate.ok ? 'opacity-35' : ''}`} style={{ background: `radial-gradient(circle at 35% 30%, #ffffff66, transparent 45%), ${p.hex}` }}>
                    {!have && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-canvas flex items-center justify-center text-slate-300">
                        <Icon name={gate.ok ? 'coin' : '🔒'} size={11} />
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight text-center truncate w-full">{have ? p.name : gate.ok ? p.unlock.coins : `LV ${p.unlock.level}`}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* vehicles */}
      <div>
        <p className="eyebrow">Vehicles</p>
        <div className="mt-2 grid grid-cols-2 gap-2.5 rows-stagger">
          {VEHICLES.map((v) => {
            const have = owns(world, v.id);
            const gate = canUnlock(v.unlock, stats);
            const vPaint = PAINTS.find((p) => p.id === (world.paints?.[v.id] ?? v.paint))?.hex ?? '#888';
            const on = v.id === featured.id;
            return (
              <div key={v.id} className={`relative rounded-[22px] p-3 ${on ? 'world-home-here' : 'bg-white/[0.035]'}`}>
                <button onClick={() => have && dispatch({ type: 'WORLD_FEATURE', vehicleId: v.id })} className="block w-full" aria-label={have ? `Show ${v.name}` : v.name}>
                  <VehicleArt vehicle={v} paint={vPaint} className={`w-full h-auto ${have ? '' : 'grayscale opacity-40'}`} />
                </button>
                <p className="mt-1 text-[13px] font-semibold text-white leading-tight">{v.name}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: RARITY_COLOR[v.rarity] }}>
                  {v.rarity}
                </p>
                {!have && <Requirements unlock={v.unlock} stats={stats} compact />}
                <div className="mt-2">
                  {have ? (
                    on ? (
                      <span className="text-xs font-bold text-[var(--mood)]">In the spotlight</span>
                    ) : (
                      <button onClick={() => dispatch({ type: 'WORLD_FEATURE', vehicleId: v.id })} className="w-full rounded-full bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
                        Show
                      </button>
                    )
                  ) : full && gate.ok ? (
                    <p className="text-[11px] text-slate-400">Garage full. Add a spot below.</p>
                  ) : (
                    <BuyButton gate={gate} coins={v.unlock.coins} small onClick={() => onBuy({ id: v.id, name: v.name, coins: v.unlock.coins })} verb="Get" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {nextSpot && (
        <div className="rounded-[24px] bg-white/[0.035] p-4 flex items-center gap-3">
          <span className="shrink-0 w-11 h-11 rounded-2xl bg-white/[0.06] text-slate-300 flex items-center justify-center">
            <Icon name="＋" size={20} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white">Bigger garage</p>
            <p className="text-[13px] text-slate-400">Room for one more vehicle ({spots + 1} spots).</p>
            <Requirements unlock={nextSpot.unlock} stats={stats} />
          </div>
          <BuyButton gate={canUnlock(nextSpot.unlock, stats)} coins={nextSpot.unlock.coins} small onClick={() => onBuy({ id: nextSpot.id, name: 'a bigger garage', coins: nextSpot.unlock.coins })} verb="Build" />
        </div>
      )}
    </>
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
  // Locked: the requirement list above already says what's missing.
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

function ItemCard({
  name,
  swatch,
  unlock,
  stats,
  owned,
  active,
  activeLabel,
  ownedLabel,
  onUse,
  onBuy,
}: {
  name: string;
  swatch?: string;
  unlock: Unlock;
  stats: DerivedStats;
  owned: boolean;
  active: boolean;
  activeLabel: string;
  ownedLabel: string;
  onUse: () => void;
  onBuy: () => void;
}) {
  const gate = canUnlock(unlock, stats);
  return (
    <div className={`rounded-[20px] p-3 ${active ? 'world-home-here' : 'bg-white/[0.035]'}`}>
      <div className="flex items-center gap-2">
        {swatch && <span className="shrink-0 w-5 h-5 rounded-full" style={{ background: swatch, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.2)' }} />}
        <p className="min-w-0 text-[13px] font-semibold text-white leading-tight">{name}</p>
      </div>
      {!owned && <Requirements unlock={unlock} stats={stats} compact />}
      <div className="mt-2">
        {active ? (
          <span className="text-xs font-bold text-[var(--mood)]">{activeLabel}</span>
        ) : owned ? (
          <button onClick={onUse} className="w-full rounded-full bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
            {ownedLabel}
          </button>
        ) : (
          <BuyButton gate={gate} coins={unlock.coins} small onClick={onBuy} verb="Get" />
        )}
      </div>
    </div>
  );
}
