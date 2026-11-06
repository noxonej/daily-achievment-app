import { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { checkedPlanIds, formatPlanTime, planCategory, planItemsForDay, todayWeekday } from '../lib/weekPlan';
import { focusTimer } from '../lib/focusTimer';
import { Icon } from './Icon';

function minutesNow(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}
function toMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function inLabel(mins: number) {
  if (mins < 60) return `in ${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `in ${h}h ${m}m` : `in ${h}h`;
}

/** What you should be doing right now, and what's next, from today's plan. */
export function NowNextCard({ onOpenPlan }: { onOpenPlan: () => void }) {
  const { state, dispatch } = useApp();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const items = planItemsForDay(state, todayWeekday(now)).filter((i) => i.time);
  if (items.length === 0) return null;
  const checked = checkedPlanIds(state);
  const nowMin = minutesNow(now);
  const currentIdx = items.reduce((idx, it, i) => (toMin(it.time!) <= nowMin ? i : idx), -1);
  const current = currentIdx >= 0 ? items[currentIdx] : null;
  const next = items[currentIdx + 1] ?? null;
  const dayOver = !next && current && checked.has(current.id);
  const doneCount = items.filter((i) => checked.has(i.id)).length;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.10] via-white/[0.02] to-transparent p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
          <span className="relative flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-60" />
            <span className="relative w-2 h-2 rounded-full bg-amber-400" />
          </span>
          {dayOver ? 'Day complete' : 'Right now'}
        </p>
        <button onClick={onOpenPlan} className="text-xs font-semibold text-slate-400 hover:text-white tabular-nums">
          {doneCount}/{items.length} done →
        </button>
      </div>

      {current && !dayOver ? (
        <div className="flex items-center gap-3">
          <span className={`w-1.5 self-stretch rounded-full ${planCategory(current.category)?.bar ?? 'bg-amber-400'}`} />
          <div className="flex-1 min-w-0">
            <p className={`font-display text-xl font-bold leading-tight ${checked.has(current.id) ? 'text-slate-500 line-through' : 'text-white'}`}>
              {current.text}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 tabular-nums">Since {formatPlanTime(current.time!)}</p>
          </div>
        </div>
      ) : !current ? (
        <p className="font-display text-xl font-bold text-white">Your day starts {inLabel(toMin(items[0].time!) - nowMin)}</p>
      ) : (
        <p className="font-display text-xl font-bold text-white">You did it. Rest well tonight.</p>
      )}

      {current && !dayOver && (
        <div className="flex gap-2 mt-3.5">
          <button
            onClick={() => dispatch({ type: 'PLAN_TOGGLE', itemId: current.id })}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition ${
              checked.has(current.id) ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-500 hover:bg-emerald-400 text-white'
            }`}
          >
            <Icon name="✓" size={16} strokeWidth={3} />
            {checked.has(current.id) ? 'Done' : 'Mark done'}
          </button>
          <button
            onClick={() => focusTimer.open(current.text)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10"
          >
            <Icon name="⏱" size={16} />
            Focus
          </button>
        </div>
      )}

      {next && (
        <div className="mt-3.5 pt-3 border-t border-white/[0.07] flex items-center gap-2 text-sm">
          <span className="text-slate-500 font-semibold">Next</span>
          <span className="flex-1 min-w-0 truncate text-slate-200">{next.text}</span>
          <span className="shrink-0 text-xs font-bold text-amber-300 tabular-nums">
            {formatPlanTime(next.time!)} · {inLabel(toMin(next.time!) - nowMin)}
          </span>
        </div>
      )}
    </div>
  );
}
