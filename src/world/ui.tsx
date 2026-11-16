import type { DerivedStats } from '../lib/types';
import { Coin } from '../components/Coin';
import { Icon } from '../components/Icon';
import type { Unlock } from './catalog';
import { canUnlock } from './catalog';

/** Shared bits for the World screens (moved out of WorldView 2026-11-16). */
export function Requirements({ unlock, stats, compact = false }: { unlock: Unlock; stats: DerivedStats; compact?: boolean }) {
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

export function BuyButton({ gate, coins, onClick, verb, small = false }: { gate: ReturnType<typeof canUnlock>; coins: number; onClick: () => void; verb: string; small?: boolean }) {
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
