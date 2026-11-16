import { useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { setIntent } from '../lib/intents';
import { Icon } from '../components/Icon';
import { GarageScene } from './Garage';
import { garageEnvOf, owns, ownedVehicles, TROPHIES, VEHICLES, worldOf } from './catalog';

/**
 * Today → "Your world" (2026-11-16). One glance at the three connected systems: you, your ride,
 * and the next thing your real-life progress unlocks. Tapping opens the garage.
 */
export function YourWorldCard({ onOpen }: { onOpen: () => void }) {
  const { state, stats } = useApp();
  const world = worldOf(state);
  const owned = ownedVehicles(world);
  const ride = VEHICLES.find((v) => v.id === world.vehicle && owns(world, v.id)) ?? owned[0] ?? null;
  const env = garageEnvOf(world);

  // The unearned trophy you're closest to: the "one more push" goal.
  const next = useMemo(() => {
    const open = TROPHIES.map((t) => ({ t, v: Math.min(stats[t.stat], t.target) })).filter((x) => x.v < x.t.target);
    open.sort((a, b) => b.v / b.t.target - a.v / a.t.target);
    return open[0] ?? null;
  }, [stats]);

  return (
    <button
      onClick={() => {
        setIntent('world-garage');
        onOpen();
      }}
      className="world-card w-full text-left overflow-hidden rounded-[24px] active:scale-[0.99] transition"
      aria-label="Open your garage"
    >
      <div className="theme-dark relative">
        <GarageScene world={world} stats={stats} vehicle={ride} look={state.character} />
        <span className="absolute left-3 top-3 px-label text-[9px] text-amber-200 bg-black/55 rounded px-1.5 py-1">Your world</span>
      </div>
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-white truncate">
            {ride ? ride.name : 'No ride yet'} <span className="text-slate-400 font-normal">· {env.name}</span>
          </p>
          {next ? (
            <>
              <p className="mt-0.5 text-[12px] text-slate-400 truncate">
                Next trophy: {next.t.label.toLowerCase()} <span className="num-px text-[14px] text-slate-200">{Math.floor(next.v)}/{next.t.target}</span>
              </p>
              <span className="px-bar mt-1.5 block" style={{ ['--p' as string]: `${(next.v / next.t.target) * 100}%` }} />
            </>
          ) : (
            <p className="mt-0.5 text-[12px] text-slate-400">Every garage trophy earned. Legend.</p>
          )}
        </div>
        <Icon name="›" size={20} className="text-slate-500 shrink-0" />
      </div>
    </button>
  );
}
