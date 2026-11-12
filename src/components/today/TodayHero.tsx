import { useApp } from '../../store/AppContext';
import { Fire } from '../fx/Fire';
import { levelFromTotalXp } from '../../lib/xp';
import { addDaysToKey, todayKey } from '../../lib/date';
import { useDailyResetLabel } from '../../lib/useResetCountdown';
import { useCountUp } from '../../lib/useCountUp';
import type { Quest } from '../../lib/types';
import { Icon } from '../Icon';
import { Coin } from '../Coin';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * The top of Today, drawn straight onto the glow: this week as rings (how much of each day you did),
 * a big arc for today, one tap for what's next, and your streak, level and coins underneath.
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
  const shownPct = useCountUp(Math.round(pct * 100), 900, 0);
  const shownCoins = useCountUp(stats.availableShards, 900, 0);
  const next = quests.find((q) => !completed.includes(q.id));
  const today = todayKey();
  const dow = (new Date().getDay() + 6) % 7;
  const rest = new Set(stats.graceDates);
  const shielded = new Set(state.shieldedDates ?? []);
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDaysToKey(today, i - dow);
    const log = state.dayLogs[date];
    const isToday = date === today;
    const frac = isToday ? pct : log ? Math.min(1, log.completedQuestIds.length / Math.max(1, log.dailyQuestCount || 1)) : 0;
    return { date, day: Number(date.slice(8)), label: WEEKDAYS[i], frac, rest: rest.has(date) || shielded.has(date), future: date > today, isToday };
  });
  const perfect = total > 0 && done === total;

  // The arc: a half circle that fills left to right, with a glowing knob at the tip.
  const R = 118;
  const cx = 150;
  const cy = 148;
  const angle = Math.PI - pct * Math.PI;
  const knob = { x: cx + R * Math.cos(angle), y: cy - R * Math.sin(angle) };
  const arc = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`;
  const streak = stats.currentStreak;

  return (
    <section aria-label="Today at a glance" className="relative">
      {/* this week, one ring per day */}
      <div className="grid grid-cols-7 gap-1" role="list" aria-label="This week">
        {week.map((d, i) => {
          const size = d.isToday ? 46 : 38;
          const r = size / 2 - 3;
          const c = 2 * Math.PI * r;
          return (
            <div key={d.date} role="listitem" className="day-in flex flex-col items-center gap-1.5" style={{ animationDelay: `${0.05 + i * 0.045}s` }}>
              <div className="relative flex items-center justify-center" style={{ width: 46, height: 46 }}>
                {d.isToday && <span className="absolute inset-0 rounded-full bg-[var(--mood)] opacity-25 blur-md" aria-hidden="true" />}
                <svg width={size} height={size} className="-rotate-90 relative" aria-hidden="true">
                  <circle cx={size / 2} cy={size / 2} r={r} fill={d.isToday ? 'rgba(255,244,232,.08)' : 'none'} stroke="currentColor" strokeWidth={d.isToday ? 2.5 : 2} className={d.future ? 'text-white/[0.06]' : 'text-white/[0.12]'} />
                  {d.frac > 0 && (
                    <circle
                      cx={size / 2}
                      cy={size / 2}
                      r={r}
                      fill="none"
                      stroke="var(--mood)"
                      strokeWidth={d.isToday ? 3 : 2.5}
                      strokeLinecap="round"
                      strokeDasharray={c}
                      strokeDashoffset={c * (1 - d.frac)}
                      style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)' }}
                    />
                  )}
                </svg>
                <span
                  className={`absolute font-display tabular-nums leading-none ${
                    d.isToday ? 'text-[17px] font-semibold text-white' : d.future ? 'text-[14px] text-slate-600' : 'text-[14px] text-slate-300'
                  }`}
                >
                  {d.day}
                </span>
                {d.rest && !d.future && <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-sky-300" title="Rest day" />}
              </div>
              <span className={`text-[11px] leading-none ${d.isToday ? 'font-bold text-white' : 'text-slate-500'}`}>{d.label}</span>
            </div>
          );
        })}
      </div>

      {/* today's arc */}
      <div className="relative mx-auto mt-3 w-full max-w-[340px]" role="img" aria-label={`${done} of ${total} quests done today`}>
        <svg viewBox="0 0 300 168" className="w-full overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id="todayArc" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" style={{ stopColor: 'var(--mood2)' }} />
              <stop offset="0.6" style={{ stopColor: 'var(--mood)' }} />
              <stop offset="1" stopColor="#e6fbff" />
            </linearGradient>
          </defs>
          {/* tick marks */}
          {Array.from({ length: 31 }, (_, i) => {
            const a = Math.PI - (i / 30) * Math.PI;
            const r1 = R + 14;
            const r2 = R + (i % 5 === 0 ? 22 : 18);
            return (
              <line
                key={i}
                x1={cx + r1 * Math.cos(a)}
                y1={cy - r1 * Math.sin(a)}
                x2={cx + r2 * Math.cos(a)}
                y2={cy - r2 * Math.sin(a)}
                stroke="currentColor"
                strokeWidth={i % 5 === 0 ? 1.6 : 1}
                strokeLinecap="round"
                className={i / 30 <= pct && pct > 0 ? 'text-[var(--mood)]' : 'text-white/[0.12]'}
                style={{ transition: 'color .6s' }}
              />
            );
          })}
          <path d={arc} fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" className="text-white/[0.06]" />
          <path
            d={arc}
            fill="none"
            stroke="url(#todayArc)"
            strokeWidth="16"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={100 - Math.max(pct * 100, 0.001)}
            className="arc-draw"
            style={{ ['--arc-len' as string]: '100', transition: 'stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)' }}
          />
          <g className="knob-glow" style={{ transition: 'transform 1s cubic-bezier(.22,1,.36,1)', transform: `translate(${knob.x}px, ${knob.y}px)` }}>
            <circle r="15" fill="#fbf7f2" />
            <circle r="5" fill="var(--mood)" />
          </g>
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center">
          {perfect ? (
            <>
              <Icon name="✨" size={38} className="text-[var(--mood)] animate-pop-in" />
              <span className="mt-2 font-display text-xl font-semibold text-white">Perfect day</span>
            </>
          ) : (
            <span className="num-thin text-[68px] text-white">
              {shownPct}
              <span className="text-[28px] text-slate-400 align-top ml-0.5">%</span>
            </span>
          )}
          <span className="mt-2 text-[13px] text-slate-400 tabular-nums">
            {done} of {total} quests today
            {boost > 1 && <span className="ml-1.5 font-bold text-yellow-300">{boost >= 2 ? '· 2× XP' : '· 1.5× XP'}</span>}
          </span>
        </div>
      </div>

      {/* what to do next */}
      <div className="mt-5 flex justify-center">
        {next ? (
          <button onClick={() => onDoNext(next)} className="pill-light max-w-full pl-2 pr-5 py-2 text-left">
            <span className="shrink-0 w-9 h-9 rounded-full bg-[#15110e] text-[#fbf7f2] flex items-center justify-center">
              <Icon name={next.icon} size={17} />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] opacity-55 leading-tight">Up next · +{Math.round(next.xp * boost)} XP</span>
              <span className="block text-[15px] font-bold truncate leading-tight">{next.title}</span>
            </span>
          </button>
        ) : total > 0 ? (
          <p className="rounded-full bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-200">
            <Icon name="✨" size={15} className="icon-inline" />
            Every quest done. Rest well, you earned it.
          </p>
        ) : null}
      </div>

      {/* streak, level and coins */}
      <div className="panel-glass mt-5 grid grid-cols-3 divide-x divide-white/[0.07] py-4">
        <div className="flex flex-col items-center gap-1.5 px-2">
          <span className="flex items-center gap-1">
            <Fire size={22} lit={streak > 0} intensity={streak >= 30 ? 3 : streak >= 7 ? 2 : 1} />
            <span className="num-thin text-[34px] text-white">{streak}</span>
          </span>
          <span className="text-[11px] text-slate-400">day streak</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 px-3">
          <span className="num-thin text-[34px] text-white">
            <span className="text-[14px] text-slate-400 font-semibold tracking-normal mr-1">LV</span>
            {level}
          </span>
          <span className="w-full h-1 rounded-full bg-white/[0.08] overflow-hidden">
            <span className="block h-full rounded-full bg-[var(--mood)] transition-[width] duration-700" style={{ width: `${Math.max(4, (xpIntoLevel / xpForNextLevel) * 100)}%` }} />
          </span>
          <span className="text-[11px] text-slate-400 tabular-nums whitespace-nowrap">{toNext} XP to {level + 1}</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 px-2">
          <span className="flex items-center gap-1.5">
            <Coin size={20} />
            <span className="num-thin text-[34px] text-white">{shownCoins}</span>
          </span>
          <span className="text-[11px] text-slate-400">coins</span>
        </div>
      </div>

      <div className="relative mt-3 flex flex-wrap items-center justify-center gap-2">
        <span className="text-[11px] text-slate-500">
          <Icon name="🔄" size="1.1em" className="icon-inline" />
          New quests in {resetLabel}
        </span>
        {extras}
      </div>
    </section>
  );
}
