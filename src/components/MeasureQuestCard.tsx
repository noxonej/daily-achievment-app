import { useState } from 'react';
import type { Quest } from '../lib/types';
import { UNIT_META } from '../lib/measure';
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL } from '../lib/xp';
import { useCompletionFx } from '../lib/useCompletionFx';
import { questReward } from '../lib/rewards';
import { runTracker } from '../lib/runTracker';
import { FloatingReward } from './FloatingReward';
import { InfoDisclosure } from './InfoDisclosure';
import { Icon } from './Icon';
import { locale } from '../lib/locale';


function fmt(n: number, decimals?: boolean) {
  return decimals ? (Math.round(n * 100) / 100).toLocaleString(locale(), { maximumFractionDigits: 2 }) : Math.round(n).toLocaleString(locale());
}

/** A quest with a number goal (steps, km, glasses of water…): log progress, it completes at the target. */
export function MeasureQuestCard({
  quest,
  value,
  completed,
  onSet,
  periodKey,
}: {
  quest: Quest;
  value: number;
  completed: boolean;
  onSet: (v: number) => void;
  periodKey: string;
}) {
  const m = quest.measure!;
  const meta = UNIT_META[m.unit];
  const { justCompleted } = useCompletionFx(completed);
  const { xp, crit } = questReward(periodKey, quest.id, quest.xp);
  const [entry, setEntry] = useState('');
  const pct = Math.min(100, (value / m.target) * 100);
  const entryNum = Number(entry.replace(/[\s,]/g, m.unit === 'km' ? '.' : ''));

  return (
    <div className={`relative rounded-xl border px-4 py-3.5 transition-colors ${completed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/[0.03] border-white/10'}`}>
      <div className="flex items-center gap-3">
        <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${completed ? 'bg-emerald-500/20' : 'bg-white/5'} ${justCompleted ? 'animate-pop-in' : ''}`}>
          {completed ? <Icon name="✅" size={20} className="text-emerald-300 animate-check" /> : <Icon name={quest.icon} size={19} className="text-slate-200" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-semibold text-[15px] leading-tight ${completed ? 'text-emerald-300' : 'text-white'}`}>{quest.title}</p>
          {quest.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{quest.description}</p>}
          {quest.details && (
            <div className="mt-1">
              <InfoDisclosure text={quest.details} />
            </div>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${DIFFICULTY_COLOR[quest.difficulty]}`}>{DIFFICULTY_LABEL[quest.difficulty]}</span>
          <span className="text-[11px] font-display font-bold text-amber-300">+{quest.xp} XP</span>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-display font-bold text-white tabular-nums">
            {fmt(value, meta.decimals)}
            <span className="text-slate-500 font-medium"> / {fmt(m.target, meta.decimals)} {meta.label}</span>
          </span>
          <span className={`text-xs font-bold tabular-nums ${completed ? 'text-emerald-300' : 'text-slate-400'}`}>{Math.floor(pct)}%</span>
        </div>
        {m.unit === 'glasses' ? (
          <div className="flex gap-1.5 mt-2">
            {Array.from({ length: m.target }, (_, i) => (
              <button
                key={i}
                onClick={() => onSet(i < value ? i : i + 1)}
                aria-label={`${i + 1} ${i ? 'glasses' : 'glass'}`}
                className={`flex-1 h-8 rounded-lg flex items-center justify-center transition ${i < value ? 'bg-sky-500/80 text-white' : 'bg-white/5 text-slate-600 border border-white/10'}`}
              >
                <Icon name="💧" size={14} fill={i < value ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        ) : (
          <div className="h-2 rounded-full bg-white/10 overflow-hidden mt-2">
            <div className={`h-full rounded-full transition-all duration-500 ${completed ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      {m.unit !== 'glasses' && (
        <div className="flex flex-wrap gap-2 mt-3">
          {m.unit === 'km' && (
            <button onClick={() => runTracker.open()} className="flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold px-3 py-2">
              <Icon name="▶" size={14} fill="currentColor" />
              Start run
            </button>
          )}
          {m.unit !== 'km' &&
            meta.quick.map((q) => (
              <button key={q} onClick={() => onSet(value + q)} className="rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-semibold text-slate-200 px-3 py-2 tabular-nums">
                +{fmt(q)}
              </button>
            ))}
          <form
            className="flex flex-1 min-w-[9rem] gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!(entryNum >= 0)) return;
              onSet(m.unit === 'steps' ? entryNum : value + entryNum);
              setEntry('');
            }}
          >
            <input
              inputMode={meta.decimals ? 'decimal' : 'numeric'}
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder={m.unit === 'steps' ? "Today's total" : m.unit === 'km' ? 'Add km' : `Add ${meta.label}`}
              aria-label={m.unit === 'steps' ? "Today's step total" : `Add ${meta.label}`}
              className="flex-1 min-w-0 rounded-lg bg-black/20 border border-white/10 px-3 h-9 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
            />
            <button type="submit" disabled={!entry || !(entryNum >= 0)} className="shrink-0 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white text-sm font-bold px-3">
              {m.unit === 'steps' ? 'Set' : 'Add'}
            </button>
          </form>
          {value > 0 && (
            <button onClick={() => onSet(0)} aria-label="Reset" className="rounded-lg text-xs text-slate-500 hover:text-slate-300 px-2">
              Reset
            </button>
          )}
        </div>
      )}
      {justCompleted && <FloatingReward xp={xp} crit={crit} />}
    </div>
  );
}
