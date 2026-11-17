import { useApp } from '../store/AppContext';
import { weekKey } from '../lib/date';
import { byPriority, goalPlan } from '../lib/goalCoach';
import { shortNum } from '../lib/num';
import { Icon } from './Icon';

/** One ring: how far along a goal is. */
function Ring({ frac, size, stroke, color, children }: { frac: number; size: number; stroke: number; color: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-white/[0.08]" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, frac)))}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </span>
  );
}

const STATUS_COLOR = { ahead: '#34d399', 'on-track': '#7cc7ff', behind: '#fb923c', 'just-started': '#a5b4fc', done: '#facc15' } as const;

/**
 * The top of Goals (2026-11-17 redesign, after Apple Fitness / Strava): one big ring for all your
 * goals together, how the year is going, and a row of small rings, one per goal, to jump straight to it.
 */
export function GoalsHero({ onOpen }: { onOpen: (section: 'weekly' | 'goals') => void }) {
  const { state } = useApp();
  const goals = state.goals.filter((g) => !g.completedAt).sort(byPriority);
  const plans = goals.map((g) => ({ g, p: goalPlan(g) }));
  const overall = plans.length ? plans.reduce((n, x) => n + x.p.done, 0) / plans.length : 0;
  const count = (s: string[]) => plans.filter((x) => s.includes(x.p.status)).length;
  const now = new Date();
  const y0 = new Date(now.getFullYear(), 0, 1).getTime();
  const y1 = new Date(now.getFullYear() + 1, 0, 1).getTime();
  const yearUsed = (now.getTime() - y0) / (y1 - y0);
  const key = weekKey();
  const weekly = state.quests.filter((q) => q.frequency === 'weekly' && !q.archived && q.wildcardWeekKey !== key);
  const doneWeekly = weekly.filter((q) => state.weekLogs[key]?.completedQuestIds.includes(q.id)).length;

  const jump = (id: string) => {
    onOpen('goals');
    setTimeout(() => {
      const el = document.getElementById(`goal-${id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el?.classList.add('attention');
      setTimeout(() => el?.classList.remove('attention'), 1400);
    }, 120);
  };

  return (
    <div className="space-y-3">
      <div className="goals-hero relative overflow-hidden rounded-[28px] p-5">
        <div className="flex items-center gap-5">
          <Ring frac={overall} size={112} stroke={11} color="var(--mood)">
            <span className="text-center leading-none">
              <span className="num-px text-[34px] text-white">{Math.round(overall * 100)}</span>
              <span className="num-px text-[16px] text-slate-400">%</span>
            </span>
          </Ring>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-slate-300">{plans.length ? `${plans.length} ${plans.length === 1 ? 'goal' : 'goals'} this year` : 'No goals yet'}</p>
            <div className="mt-2 space-y-1.5 text-[13px]">
              {(
                [
                  ['On track', count(['on-track', 'ahead', 'just-started']), STATUS_COLOR['on-track']],
                  ['Behind', count(['behind']), STATUS_COLOR.behind],
                  ['Done', state.goals.filter((g) => g.completedAt).length, STATUS_COLOR.done],
                ] as const
              ).map(([label, n, c]) => (
                <p key={label} className="flex items-center gap-2 text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                  <span className="flex-1">{label}</span>
                  <span className="num-px text-[18px] text-white">{n}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
        {/* how much of the year is gone, so you see if your goals keep up */}
        <div className="mt-4">
          <div className="flex justify-between text-[11px] font-semibold text-slate-400">
            <span>{now.getFullYear()}</span>
            <span>
              <span className="num-px text-[13px] text-slate-200">{Math.round(yearUsed * 100)}%</span> of the year gone
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div className="h-full rounded-full bg-white/40" style={{ width: `${yearUsed * 100}%` }} />
          </div>
        </div>
      </div>

      {(plans.length > 0 || weekly.length > 0) && (
        <div className="-mx-4 px-4 overflow-x-auto no-scrollbar" aria-label="Jump to a goal">
          <div className="flex gap-3 w-max pb-1">
            {plans.map(({ g, p }) => (
              <button key={g.id} onClick={() => jump(g.id)} className="w-[76px] flex flex-col items-center gap-1.5 active:scale-95 transition-transform" aria-label={`${g.title}: ${Math.round(p.done * 100)}%`}>
                <Ring frac={p.done} size={60} stroke={6} color={STATUS_COLOR[p.status]}>
                  <Icon name={g.icon} size={20} className="text-white" />
                </Ring>
                <span className="w-full text-center text-[11px] font-semibold text-slate-300 leading-tight line-clamp-2">{g.title}</span>
                <span className="num-px text-[13px] text-slate-400 -mt-1">
                  {shortNum(g.progress)}/{shortNum(g.target)}
                </span>
              </button>
            ))}
            {weekly.length > 0 && (
              <button onClick={() => onOpen('weekly')} className="w-[76px] flex flex-col items-center gap-1.5 active:scale-95 transition-transform" aria-label={`This week: ${doneWeekly} of ${weekly.length}`}>
                <Ring frac={doneWeekly / weekly.length} size={60} stroke={6} color="#c4b5fd">
                  <Icon name="🗡" size={20} className="text-white" />
                </Ring>
                <span className="w-full text-center text-[11px] font-semibold text-slate-300 leading-tight">This week</span>
                <span className="num-px text-[13px] text-slate-400 -mt-1">
                  {doneWeekly}/{weekly.length}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
