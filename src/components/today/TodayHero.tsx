import { useApp } from '../../store/AppContext';
import { levelFromTotalXp } from '../../lib/xp';
import { addDaysToKey, todayKey } from '../../lib/date';
import { useDailyResetLabel } from '../../lib/useResetCountdown';
import { useCountUp } from '../../lib/useCountUp';
import type { Quest } from '../../lib/types';
import { Icon } from '../Icon';

/**
 * The top of Today: one glance tells you how far along today is, how close the next level is,
 * how your week is going (consistency, not perfection) and what to do next.
 */
export function TodayHero({
  quests,
  completed,
  onDoNext,
  boost,
  extras,
}: {
  quests: Quest[];
  completed: string[];
  onDoNext: (q: Quest) => void;
  boost: number;
  extras?: React.ReactNode;
}) {
  const { state, stats } = useApp();
  const resetLabel = useDailyResetLabel();
  const done = quests.filter((q) => completed.includes(q.id)).length;
  const total = quests.length;
  const pct = total ? done / total : 0;
  const { level, xpIntoLevel, xpForNextLevel } = levelFromTotalXp(stats.totalXp);
  const toNext = Math.max(0, xpForNextLevel - xpIntoLevel);
  const shownPct = useCountUp(Math.round(pct * 100), 700, 0);
  const next = quests.find((q) => !completed.includes(q.id));
  const today = todayKey();
  const dow = (new Date().getDay() + 6) % 7;
  const rest = new Set(stats.graceDates);
  const shielded = new Set(state.shieldedDates ?? []);
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDaysToKey(today, i - dow);
    const did = !!state.dayLogs[date]?.completedQuestIds.length;
    return { date, did, rest: rest.has(date) || shielded.has(date), future: date > today, isToday: date === today };
  });
  const perfect = total > 0 && done === total;
  const R = 34;
  const C = 2 * Math.PI * R;

  return (
    <section aria-label="Today at a glance" className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent p-4 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.9)]">
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
      <div className="relative flex items-center gap-4">
        {/* today's progress ring */}
        <div className="relative shrink-0 w-[92px] h-[92px]" role="img" aria-label={`${done} of ${total} quests done today`}>
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r={R} fill="none" stroke="currentColor" strokeWidth="7" className="text-white/[0.07]" />
            <circle
              cx="40"
              cy="40"
              r={R}
              fill="none"
              stroke="url(#heroRing)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
              style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)' }}
            />
            <defs>
              <linearGradient id="heroRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--color-emerald-400)" />
                <stop offset="1" stopColor="var(--color-amber-400)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {perfect ? (
              <Icon name="✨" size={26} className="text-emerald-300 animate-pop-in" />
            ) : (
              <span className="font-display text-[22px] font-extrabold text-white tabular-nums leading-none">{shownPct}%</span>
            )}
            <span className="text-[10px] font-semibold text-slate-400 mt-1 tabular-nums">
              {done}/{total} quests
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-2.5">
          {/* next level */}
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-bold text-white">
                Level {level}
                {boost > 1 && <span className="ml-1.5 text-[10px] font-bold text-yellow-300">{boost >= 2 ? '2× XP' : '1.5× XP'}</span>}
              </span>
              <span className="text-[11px] text-slate-400 tabular-nums">{toNext} XP to {level + 1}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-white/[0.07] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-[width] duration-700" style={{ width: `${Math.max(3, (xpIntoLevel / xpForNextLevel) * 100)}%` }} />
            </div>
          </div>
          {/* streak + this week (consistency beats perfection) */}
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <Icon name="🔥" size={13} className={stats.currentStreak > 0 ? 'text-orange-400' : 'text-slate-500'} />
                {stats.currentStreak} day streak
              </span>
              <span className="text-[11px] text-slate-400 tabular-nums">{stats.activeThisWeek}/{dow + 1} days this week</span>
            </div>
            <div className="mt-1.5 grid grid-cols-7 gap-1" aria-hidden="true">
              {week.map((d) => (
                <span
                  key={d.date}
                  className={`h-2 rounded-full ${
                    d.did ? 'bg-gradient-to-r from-orange-400 to-amber-300' : d.rest ? 'bg-sky-400/50' : d.future ? 'bg-white/[0.05]' : d.isToday ? 'bg-white/15 animate-pulse' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* what to do next */}
      {next ? (
        <button
          onClick={() => onDoNext(next)}
          className="relative mt-4 w-full flex items-center gap-3 rounded-2xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.09] px-3 py-2.5 text-left transition active:scale-[0.99]"
        >
          <span className="shrink-0 w-9 h-9 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
            <Icon name={next.icon} size={18} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-300/90">Up next</span>
            <span className="block text-sm font-semibold text-white truncate">{next.title}</span>
          </span>
          <span className="shrink-0 text-xs font-bold text-amber-200 tabular-nums">+{Math.round(next.xp * boost)} XP</span>
          <Icon name="›" size={18} className="shrink-0 text-slate-500" />
        </button>
      ) : total > 0 ? (
        <p className="relative mt-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 px-3 py-2.5 text-sm font-semibold text-emerald-200">
          <Icon name="✨" size={15} className="icon-inline" />
          Every quest done. Rest well, you earned it.
        </p>
      ) : null}

      <div className="relative mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-slate-500">
          <Icon name="🔄" size="1.1em" className="icon-inline" />
          New quests in {resetLabel}
        </span>
        {extras}
      </div>
    </section>
  );
}
