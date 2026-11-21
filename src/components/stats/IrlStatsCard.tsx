import { ShareButton } from '../ShareButton';
import { useState } from 'react';
import { STAT_IDS, STATS, overallStatLevel, type StatId } from '../../lib/irlStats';
import { Icon } from '../Icon';
import { StatsRadar } from './StatsRadar';
import { useIrlStats } from './useIrlStats';
import { L, isLt } from '../../lib/lang';

/** You tab: the stat chart with each stat's level, rank and progress. */
export function IrlStatsCard() {
  const s = useIrlStats();
  const [open, setOpen] = useState<StatId | null>(null);
  const lt = isLt();
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{L('IRL stats', 'IRL rodikliai')}</p>
          <p className="font-display text-xl font-bold text-white">
            {L('Overall', 'Bendras')} <span className="tabular-nums">LV {overallStatLevel(s)}</span>
          </p>
        </div>
        <ShareButton kind="stats" />
      </div>
      <div className="text-slate-300 flex justify-center -my-1">
        <StatsRadar stats={s} size={300} />
      </div>
      <ul className="space-y-2">
        {STAT_IDS.map((id) => {
          const v = s[id];
          const info = STATS[id];
          return (
            <li key={id}>
              <button onClick={() => setOpen(open === id ? null : id)} className="w-full text-left" aria-expanded={open === id}>
                <span className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${info.color}22`, color: info.color }}>
                    <Icon name={info.icon} size={16} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-bold text-white">{lt ? info.lt : info.label}</span>
                      <span className="text-xs font-bold tabular-nums" style={{ color: v.rank.color }}>
                        {lt ? v.rank.lt : v.rank.name} · LV {v.level}
                      </span>
                    </span>
                    <span className="mt-1 block h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                      <span className="block h-full rounded-full bar-in" style={{ width: `${Math.max(4, v.progress * 100)}%`, background: info.color }} />
                    </span>
                  </span>
                </span>
              </button>
              {open === id && (
                <p className="mt-1.5 ml-[42px] text-xs text-slate-400">
                  {L('Grows from', 'Auga nuo')}: {info.blurb}. {v.points.toLocaleString()} {L('points', 'taškų')}.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Today: a compact row of the five stats. */
export function StatRow({ onOpen }: { onOpen?: () => void }) {
  const s = useIrlStats();
  const lt = isLt();
  return (
    <button onClick={onOpen} className="w-full grid grid-cols-5 gap-1.5" aria-label={L('Your IRL stats', 'Tavo IRL rodikliai')}>
      {STAT_IDS.map((id) => (
        <span key={id} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-1 py-2 flex flex-col items-center gap-0.5 min-w-0">
          <Icon name={STATS[id].icon} size={15} style={{ color: STATS[id].color }} />
          <span className="text-[9px] font-bold uppercase tracking-tight text-slate-400 max-w-full overflow-hidden">{lt ? STATS[id].lt : STATS[id].label}</span>
          <span className="font-display text-sm font-extrabold text-white tabular-nums">{s[id].level}</span>
        </span>
      ))}
    </button>
  );
}
