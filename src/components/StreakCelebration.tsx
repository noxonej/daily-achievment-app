import { useEffect, useId, useRef, useState } from 'react';
import { useBackToClose } from '../lib/backstack';
import { useApp } from '../store/AppContext';
import { dayCountsForStreak } from '../lib/stats';
import { todayKey } from '../lib/date';
import { dateOfWeekday, WEEKDAYS, weekdayShort } from '../lib/weekPlan';
import { Confetti } from './Confetti';
import { Icon } from './Icon';

const MILESTONES: Record<number, string> = {
  3: 'Three days in a row. A habit is starting!',
  7: 'One full week! You beat most people who start.',
  14: 'Two weeks strong. This is who you are now.',
  30: 'A whole month. That is real discipline.',
  50: '50 days. Legendary.',
  100: '100 days! Almost nobody gets here.',
  365: 'One year. Unbelievable.',
};

/** A flame drawn in warm gradients; flickers gently. */
export function Flame({ size = 160, lit = true }: { size?: number; lit?: boolean }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 100 120" width={size} height={size * 1.2} aria-hidden="true" className="overflow-visible">
      <defs>
        <linearGradient id={`fo${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={lit ? '#ea580c' : '#475569'} />
          <stop offset=".6" stopColor={lit ? '#f97316' : '#64748b'} />
          <stop offset="1" stopColor={lit ? '#fb923c' : '#94a3b8'} />
        </linearGradient>
        <linearGradient id={`fi${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={lit ? '#fde047' : '#cbd5e1'} />
          <stop offset="1" stopColor={lit ? '#facc15' : '#e2e8f0'} />
        </linearGradient>
        <radialGradient id={`fg${id}`} cx=".5" cy=".6" r=".5">
          <stop offset="0" stopColor="#fb923c" stopOpacity={lit ? '.7' : '0'} />
          <stop offset="1" stopColor="#fb923c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="70" rx="60" ry="60" fill={`url(#fg${id})`} className={lit ? 'glow-pulse' : ''} style={{ transformOrigin: '50px 70px' }} />
      <g className={lit ? 'flame-dance' : ''} style={{ transformOrigin: '50px 115px' }}>
        <path d="M50 4 C58 26 82 40 82 72 C82 96 67 114 50 114 C33 114 18 96 18 72 C18 54 28 44 34 32 C36 44 40 50 46 52 C42 36 44 18 50 4Z" fill={`url(#fo${id})`} />
        <path d="M50 50 C56 62 68 70 68 86 C68 100 60 108 50 108 C40 108 32 100 32 86 C32 76 38 70 41 64 C43 72 46 75 49 76 C47 66 47 58 50 50Z" fill={`url(#fi${id})`} className={lit ? 'flame-core' : ''} style={{ transformOrigin: '50px 108px' }} />
        <path d="M36 70 C34 80 36 92 44 100" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/**
 * Pops up the first time each day a quest gets done (like Duolingo): the flame, the streak
 * number rolling up, and this week's days filling in.
 */
export function StreakCelebration() {
  const { state, stats, dispatch } = useApp();
  const today = todayKey();
  const counted = dayCountsForStreak(state.dayLogs[today]);
  const was = useRef(counted);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const before = was.current;
    was.current = counted;
    if (!before && counted && state.streakPopDate !== today) {
      dispatch({ type: 'SET_STREAK_POP', date: today });
      setShow(true);
      try {
        navigator.vibrate?.([30, 50, 60]);
      } catch {
        // optional
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counted]);

  if (!show) return null;
  return <StreakScreen streak={stats.currentStreak} best={stats.currentStreak > 1 && stats.currentStreak >= stats.longestStreak} onClose={() => setShow(false)} />;
}

function StreakScreen({ streak, best, onClose }: { streak: number; best: boolean; onClose: () => void }) {
  const { state } = useApp();
  const today = todayKey();
  const [rolled, setRolled] = useState(false);
  const [todayLit, setTodayLit] = useState(false);
  useEffect(() => {
    const a = setTimeout(() => setRolled(true), 550);
    const b = setTimeout(() => setTodayLit(true), 900);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [onClose]);

  useBackToClose(true, onClose);
  const shielded = new Set(state.shieldedDates ?? []);
  const milestone = MILESTONES[streak];
  const prev = Math.max(0, streak - 1);

  return (
    <div data-overlay className="theme-dark fixed inset-0 z-[85] flex flex-col items-center justify-center px-6 bg-[#0b0806]/95 backdrop-in" role="dialog" aria-label={`${streak} day streak`}>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(60%_45%_at_50%_38%,rgba(249,115,22,0.28),transparent_70%)]" />
      {milestone && <Confetti count={60} />}
      <div className="relative streak-flame-in">
        <Flame size={150} />
      </div>

      <div className="relative mt-2 h-[92px] overflow-hidden text-center" aria-live="polite">
        <div className={`transition-transform duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] ${rolled ? '-translate-y-[92px]' : ''}`}>
          <p className="h-[92px] font-display text-[84px] leading-[92px] font-extrabold text-orange-300/70 tabular-nums">{prev}</p>
          <p className="h-[92px] font-display text-[84px] leading-[92px] font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-orange-500 tabular-nums">
            {streak}
          </p>
        </div>
      </div>
      <p className="relative font-display text-2xl font-extrabold text-white fade-up [animation-delay:.3s]">
        {streak === 1 ? 'Streak started!' : 'day streak!'}
      </p>
      <p className="relative text-sm text-orange-100/70 mt-1.5 text-center max-w-xs fade-up [animation-delay:.4s]">
        {milestone ?? (streak === 1 ? 'Do one quest every day to keep the fire burning.' : 'You showed up again. Come back tomorrow to keep it going.')}
      </p>

      {best && (
        <span className="relative mt-3 rounded-full bg-orange-500/15 border border-orange-400/40 px-3 py-1 text-xs font-bold text-orange-200 fade-up [animation-delay:.45s]">
          <Icon name="🏆" size="1.1em" className="icon-inline" />
          New personal best
        </span>
      )}

      <div className="relative mt-7 flex gap-2 fade-up [animation-delay:.5s]">
        {WEEKDAYS.map((w) => {
          const date = dateOfWeekday(w.id);
          const isToday = date === today;
          const done = isToday ? todayLit : date < today && (shielded.has(date) || !!state.dayLogs[date]?.completedQuestIds.length);
          return (
            <div key={w.id} className="flex flex-col items-center gap-1.5">
              <span className={`text-[11px] font-bold ${isToday ? 'text-orange-300' : 'text-slate-500'}`}>{weekdayShort(w.id).slice(0, 2)}</span>
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  done
                    ? 'bg-gradient-to-b from-yellow-300 to-orange-500 border-orange-400 text-[#fff] scale-100'
                    : isToday
                      ? 'border-orange-400/70 border-dashed'
                      : 'border-white/10'
                } ${isToday && todayLit ? 'streak-day-pop' : ''}`}
              >
                {done && <Icon name={shielded.has(date) ? '🛡' : '✓'} size={16} strokeWidth={3} />}
              </span>
            </div>
          );
        })}
      </div>

      <button
        onClick={onClose}
        className="relative mt-10 w-full max-w-xs rounded-2xl bg-gradient-to-b from-orange-400 to-orange-600 text-[#fff] font-display text-lg font-bold py-4 shadow-[0_12px_30px_-10px_rgba(249,115,22,0.8)] fade-up [animation-delay:.6s]"
      >
        Continue
      </button>
    </div>
  );
}

