import { useApp } from '../store/AppContext';
import { checkedPlanIds, formatPlanTime, planCategory, planItemsForDay, todayWeekday, weekdayLabel } from '../lib/weekPlan';
import { Icon } from './Icon';

/** Today's slice of the Week Plan, so the routine is visible the moment the app opens. */
export function TodayPlanCard({ onOpen }: { onOpen: () => void }) {
  const { state, dispatch } = useApp();
  const day = todayWeekday();
  const items = planItemsForDay(state, day);
  const checked = checkedPlanIds(state);
  const doneCount = items.filter((i) => checked.has(i.id)).length;

  if (items.length === 0) {
    return (
      <button
        onClick={onOpen}
        className="w-full flex items-center justify-between rounded-2xl border border-dashed border-white/15 px-4 py-3.5 text-left hover:border-white/30 transition"
      >
        <span className="flex items-center gap-3">
          <span className="shrink-0 w-10 h-10 rounded-xl bg-white/5 text-amber-300 flex items-center justify-center"><Icon name="📅" size={20} /></span>
          <span>
            <span className="block text-sm font-semibold text-white">Plan your {weekdayLabel(day)}</span>
            <span className="block text-xs text-slate-400">Set up a Monday–Sunday routine in the Plan tab</span>
          </span>
        </span>
        <span className="text-slate-400">→</span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-sm font-semibold text-white">
          <Icon name="📅" size="1.15em" className="icon-inline text-amber-300" />{weekdayLabel(day)} plan{' '}
          <span className="text-slate-500 font-medium">
            · {doneCount}/{items.length}
          </span>
        </p>
        <button onClick={onOpen} className="text-xs font-semibold text-amber-300 hover:text-amber-200">
          Edit plan →
        </button>
      </div>
      <ul className="space-y-1">
        {items.map((item) => {
          const done = checked.has(item.id);
          return (
            <li key={item.id}>
              <button
                onClick={() => dispatch({ type: 'PLAN_TOGGLE', itemId: item.id })}
                className="w-full flex items-center gap-2.5 -mx-1 px-1 py-1 rounded-lg hover:bg-white/5 text-left transition"
              >
                <span
                  className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center text-xs transition ${
                    done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20'
                  }`}
                >
                  {done && <Icon name="✓" size={13} strokeWidth={3} />}
                </span>
                <span className={`shrink-0 w-16 text-xs font-bold tabular-nums ${done ? 'text-slate-600' : 'text-amber-300'}`}>
                  {item.time ? formatPlanTime(item.time) : '—'}
                </span>
                <span className={`flex-1 min-w-0 text-sm ${done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                  {planCategory(item.category) && (
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle ${planCategory(item.category)!.dot}`} />
                  )}
                  {item.text}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
