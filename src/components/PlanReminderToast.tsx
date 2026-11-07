import { useApp } from '../store/AppContext';
import { useLivePlanReminders } from '../lib/planReminders';
import { formatPlanTime } from '../lib/weekPlan';
import { Icon } from './Icon';

export function PlanReminderToast() {
  const { state, dispatch } = useApp();
  const { reminder, dismiss } = useLivePlanReminders(state);
  if (!reminder) return null;
  return (
    <div className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[60] px-4 flex justify-center pointer-events-none">
      <div
        role="alert"
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-amber-400/40 bg-raised/95 shadow-2xl p-4 animate-pop-in"
      >
        <div className="flex items-start gap-3">
          <span className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center"><Icon name="🔔" size={22} /></span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-300 tabular-nums">{formatPlanTime(reminder.time)} · Time for</p>
            <p className="text-white font-semibold break-words">{reminder.text}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={dismiss}
            className="flex-1 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-semibold text-slate-200 py-2 transition"
          >
            Later
          </button>
          <button
            onClick={() => {
              dispatch({ type: 'PLAN_TOGGLE', itemId: reminder.id });
              dismiss();
            }}
            className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-sm font-bold text-white py-2 transition"
          >
            <Icon name="✓" size="1.15em" className="icon-inline" />Done
          </button>
        </div>
      </div>
    </div>
  );
}
