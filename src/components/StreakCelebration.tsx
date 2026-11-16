import { useEffect, useMemo, useRef, useState } from 'react';
import { useBackToClose } from '../lib/backstack';
import { useApp } from '../store/AppContext';
import { dayCountsForStreak } from '../lib/stats';
import { todayKey } from '../lib/date';
import { dateOfWeekday, WEEKDAYS, weekdayShort } from '../lib/weekPlan';
import { Confetti } from './Confetti';
import { Icon } from './Icon';
import { Fire } from './fx/Fire';

const MILESTONES: Record<number, string> = {
  3: 'Three days in a row. A habit is starting!',
  7: 'One full week! You beat most people who start.',
  14: 'Two weeks strong. This is who you are now.',
  30: 'A whole month. That is real discipline.',
  50: '50 days. Legendary.',
  100: '100 days! Almost nobody gets here.',
  365: 'One year. Unbelievable.',
};

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
  const [closing, setClosing] = useState(false);
  // Fade the screen away, then let the streak pill in the header catch the new number.
  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      setShow(false);
      setClosing(false);
      window.dispatchEvent(new Event('squzo:streak-landed'));
    }, 340);
  };

  useEffect(() => {
    const before = was.current;
    was.current = counted;
    if (!before && counted && state.streakPopDate !== today) {
      dispatch({ type: 'SET_STREAK_POP', date: today });
      // Let the quest's own tick burst play first; the streak screen used to cover it instantly.
      const t = setTimeout(() => {
        setShow(true);
        try {
          navigator.vibrate?.([30, 50, 60]);
        } catch {
          // optional
        }
      }, 650);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counted]);

  if (!show) return null;
  return <StreakScreen streak={stats.currentStreak} best={stats.currentStreak > 1 && stats.currentStreak >= stats.longestStreak} closing={closing} onClose={close} />;
}

/** Count up from `from` to `to` over `ms`, starting after `delay`. */
function useCountUp(from: number, to: number, delay: number, ms: number) {
  const [v, setV] = useState(from);
  useEffect(() => {
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - start) / ms));
      const e = 1 - Math.pow(1 - k, 3);
      setV(Math.round(from + (to - from) * e));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, delay, ms]);
  return v;
}

/**
 * The streak moment, in beats: a spark drops in the dark, catches, and the fire bursts up with a
 * shockwave and a ring of sparks; the number rolls up and punches in; the week lights day by day;
 * embers drift up the whole screen.
 */
function StreakScreen({ streak, best, closing, onClose }: { streak: number; best: boolean; closing: boolean; onClose: () => void }) {
  const { state, stats } = useApp();
  const rest = new Set(stats.graceDates);
  const today = todayKey();
  const [lit, setLit] = useState(false);
  const [todayLit, setTodayLit] = useState(false);
  const prev = Math.max(0, streak - 1);
  const shown = useCountUp(prev, streak, 1000, Math.min(900, 300 + streak * 20));
  useEffect(() => {
    const a = setTimeout(() => setLit(true), 450);
    const b = setTimeout(() => setTodayLit(true), 2100);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);

  useBackToClose(true, onClose);
  const shielded = new Set(state.shieldedDates ?? []);
  const milestone = MILESTONES[streak];
  const intensity: 2 | 3 = streak >= 7 ? 3 : 2;
  // Embers drifting up the screen and the burst ring of sparks; random once per showing.
  const embers = useMemo(
    () => Array.from({ length: 22 }, () => ({ x: Math.random() * 100, d: Math.random() * 5, t: 4 + Math.random() * 4, s: 2 + Math.random() * 3, w: (Math.random() - 0.5) * 60 })),
    [],
  );
  const burst = useMemo(() => Array.from({ length: 16 }, (_, i) => ({ a: (i / 16) * 360 + Math.random() * 12, r: 90 + Math.random() * 70 })), []);
  const title = streak === 1 ? 'Streak started!' : 'day streak!';

  return (
    <div data-overlay className={`theme-dark fixed inset-0 z-[85] flex flex-col items-center justify-center px-6 bg-[#090604] overflow-hidden ${closing ? 'streak-out' : 'backdrop-in'}`} role="dialog" aria-label={`${streak} day streak`}>
      <div className={`absolute inset-0 pointer-events-none streak-warm ${lit ? 'on' : ''}`} />
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {embers.map((e, i) => (
          <span
            key={i}
            className="streak-ember"
            style={{ left: `${e.x}%`, width: e.s, height: e.s, animationDelay: `${0.6 + e.d}s`, animationDuration: `${e.t}s`, ['--w' as string]: `${e.w}px` }}
          />
        ))}
      </div>
      {milestone && lit && <Confetti count={70} />}

      <div className="relative flex items-end justify-center" style={{ width: 150, height: 170 }}>
        {!lit && <span className="streak-spark" aria-hidden="true" />}
        {lit && (
          <>
            <span className="streak-rays" aria-hidden="true" />
            <span className="streak-shock" aria-hidden="true" />
            <span className="streak-shock streak-shock-2" aria-hidden="true" />
            {burst.map((b, i) => (
              <span key={i} className="streak-burst" style={{ ['--a' as string]: `${b.a}deg`, ['--r' as string]: `${b.r}px` }} aria-hidden="true" />
            ))}
            <div className="streak-fire-in">
              <Fire size={130} intensity={intensity} ignite={0.6} />
            </div>
          </>
        )}
      </div>

      <div className="relative mt-3 text-center" aria-live="polite">
        <p className={`font-display text-[88px] leading-none font-extrabold tabular-nums streak-num ${lit ? 'on' : ''}`}>{shown}</p>
      </div>
      <p className="relative font-display text-2xl font-extrabold text-white mt-1" aria-label={title}>
        {title.split('').map((c, i) => (
          <span key={i} className="streak-letter" style={{ animationDelay: `${1.2 + i * 0.035}s` }}>
            {c === ' ' ? ' ' : c}
          </span>
        ))}
      </p>
      <p className="relative text-sm text-orange-100/75 mt-2 text-center max-w-xs fade-up" style={{ animationDelay: '1.6s' }}>
        {milestone ?? (streak === 1 ? 'Do one quest every day to keep the fire burning.' : 'You showed up again. Come back tomorrow to keep it going.')}
      </p>

      {best && (
        <span className="relative mt-3 rounded-full bg-orange-500/15 border border-orange-400/40 px-3 py-1 text-xs font-bold text-orange-200 streak-badge">
          <Icon name="🏆" size="1.1em" className="icon-inline" />
          New personal best
        </span>
      )}

      <div className="relative mt-7 flex gap-2">
        {WEEKDAYS.map((w, i) => {
          const date = dateOfWeekday(w.id);
          const isToday = date === today;
          const done = isToday ? todayLit : date < today && (shielded.has(date) || rest.has(date) || !!state.dayLogs[date]?.completedQuestIds.length);
          return (
            <div key={w.id} className="flex flex-col items-center gap-1.5 streak-day-in" style={{ animationDelay: `${1.7 + i * 0.06}s` }}>
              <span className={`text-[11px] font-bold ${isToday ? 'text-orange-300' : 'text-slate-500'}`}>{weekdayShort(w.id).slice(0, 2)}</span>
              <span
                className={`relative w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  done && isToday
                    ? // Today holds a live fire, so it gets a dark glowing coal instead of a bright fill that drowned the flame.
                      'bg-[radial-gradient(circle_at_50%_70%,#7c2d12,#1c0d06_75%)] border-orange-400 shadow-[0_0_16px_-2px_rgba(249,115,22,0.85)]'
                    : done
                    ? 'bg-gradient-to-b from-yellow-300 to-orange-500 border-orange-400 text-[#fff]'
                    : isToday
                      ? 'border-orange-400/70 border-dashed'
                      : 'border-white/10'
                } ${isToday && todayLit ? 'streak-day-pop' : ''}`}
              >
                {done && !isToday && <Icon name={shielded.has(date) ? '🛡' : rest.has(date) ? '🌙' : '✓'} size={16} strokeWidth={3} />}
                {isToday && todayLit && (
                  <>
                    <span className="streak-day-ring" aria-hidden="true" />
                    <Fire size={18} intensity={1} />
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <button
        onClick={onClose}
        className="relative mt-10 w-full max-w-xs overflow-hidden rounded-2xl bg-gradient-to-b from-orange-400 to-orange-600 text-[#fff] font-display text-lg font-bold py-4 shadow-[0_12px_30px_-10px_rgba(249,115,22,0.8)] fade-up btn-shine"
        style={{ animationDelay: '2.3s' }}
      >
        Continue
      </button>
    </div>
  );
}
