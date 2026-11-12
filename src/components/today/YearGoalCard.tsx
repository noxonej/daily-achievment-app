import { useApp } from '../../store/AppContext';
import { setIntent } from '../../lib/intents';
import { STATUS_LABEL, byPriority, goalPlan, goalTips } from '../../lib/goalCoach';
import { Icon } from '../Icon';
import type { ViewId } from '../NavTabs';

/**
 * "Your year" on Today: the biggest long-term goal, how you're doing against the calendar,
 * the one step that keeps it on track, and a tip that changes every day.
 */
export function YearGoalCard({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { state } = useApp();
  const goals = state.goals.filter((g) => !g.completedAt).sort(byPriority);
  const open = () => {
    setIntent('quests-goals');
    onNavigate('quests');
  };
  if (goals.length === 0) {
    return (
      <button onClick={open} className="year-card w-full text-left rounded-2xl p-4 flex items-center gap-3">
        <span className="shrink-0 w-11 h-11 rounded-xl bg-amber-400/15 text-amber-200 flex items-center justify-center">
          <Icon name="🏆" size={22} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-200/90">Your year</span>
          <span className="block font-display font-semibold text-white">Set one big goal for this year</span>
          <span className="block text-xs text-slate-400">Read 12 books, save 1,000, learn a skill. We'll plan it week by week.</span>
        </span>
        <Icon name="›" size={18} className="shrink-0 text-slate-400" />
      </button>
    );
  }
  const g = goals[0];
  const plan = goalPlan(g);
  const tip = goalTips(g)[0];
  const pct = Math.round(plan.done * 100);
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <button onClick={open} className="year-card w-full text-left rounded-2xl p-4" aria-label={`Your year: ${g.title}`}>
      <div className="flex items-center gap-3">
        <span className="relative shrink-0 w-16 h-16">
          <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90" aria-hidden="true">
            <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="6" />
            {plan.done > 0 && <circle cx="32" cy="32" r={r} fill="none" stroke="url(#yg)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${c * plan.done} ${c}`} className="arc-draw" />}
            <defs>
              <linearGradient id="yg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fde68a" />
                <stop offset="1" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-white tabular-nums">{pct}%</span>
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-x-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-200/90">Your year</span>
            <span className={`text-[10px] font-semibold whitespace-nowrap ${plan.status === 'behind' ? 'text-rose-300' : plan.status === 'ahead' ? 'text-emerald-300' : 'text-slate-400'}`}>· {STATUS_LABEL[plan.status]}</span>
          </span>
          <span className="block font-display font-semibold text-white text-[17px] leading-snug truncate">{g.title}</span>
          <span className="block text-xs text-slate-300 mt-0.5">
            <Icon name="🎯" size={12} className="icon-inline text-amber-300" />
            {plan.action}
          </span>
        </span>
        <Icon name="›" size={18} className="shrink-0 text-slate-400" />
      </div>
      {tip && (
        <p className="year-tip mt-3 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 leading-relaxed">
          <b className="text-amber-100">💡 {tip.title}.</b> {tip.text}
        </p>
      )}
      {goals.length > 1 && <p className="mt-2 text-[11px] text-slate-500">+ {goals.length - 1} more {goals.length === 2 ? 'goal' : 'goals'}</p>}
    </button>
  );
}
