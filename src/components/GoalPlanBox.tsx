import type { LongTermGoal } from '../lib/types';
import { STATUS_LABEL, goalPlan, goalTip, goalTips } from '../lib/goalCoach';
import { Icon } from './Icon';

const STATUS_TONE: Record<string, string> = {
  ahead: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/30',
  'on-track': 'bg-cyan-400/15 text-cyan-200 border-cyan-400/30',
  behind: 'bg-rose-400/15 text-rose-200 border-rose-400/30',
  'just-started': 'bg-white/10 text-slate-200 border-white/15',
  done: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/30',
};

/** Pace for a goal (ahead / behind, days left), the next concrete step and a coaching tip. */
export function GoalPlanBox({ goal, showOwnTip = false }: { goal: LongTermGoal; showOwnTip?: boolean }) {
  const plan = goalPlan(goal);
  const tips = goalTips(goal);
  // The journal already shows the tip for this kind of goal, so here we add the strategy one.
  const tip = showOwnTip ? tips[0] : goalTip(goal) ? tips[1] : tips[0];
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 space-y-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-bold uppercase tracking-wider rounded-full border px-2 py-0.5 ${STATUS_TONE[plan.status]}`}>{STATUS_LABEL[plan.status]}</span>
        {plan.daysLeft != null && <span className="text-[11px] text-slate-400">{plan.daysLeft} days left</span>}
      </div>
      {plan.daysLeft != null && (
        <div className="relative h-1.5 rounded-full bg-white/10" aria-hidden="true">
          <span className="absolute inset-y-0 left-0 rounded-full bg-amber-400" style={{ width: `${plan.done * 100}%` }} />
          {/* where you should be by now */}
          <span className="absolute -top-1 w-0.5 h-3.5 rounded bg-white/70" style={{ left: `calc(${plan.timeUsed * 100}% - 1px)` }} title="Where you should be today" />
        </div>
      )}
      <p className="text-sm text-white font-semibold flex items-start gap-1.5">
        <Icon name="🎯" size={15} className="shrink-0 text-amber-300 mt-0.5" />
        <span>{plan.action}</span>
      </p>
      {tip && (
        <p className="text-xs text-slate-300 leading-relaxed">
          <b className="text-cyan-200">{tip.title}.</b> {tip.text}
        </p>
      )}
    </div>
  );
}
