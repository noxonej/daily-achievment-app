import { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { todayKey } from '../../lib/date';
import { CHECKIN_REWARDS, PERFECT_WEEK_BONUS, checkInRewardInfo, checkInView } from '../../lib/checkIn';
import { Icon } from '../Icon';
import { Burst } from '../fx/Burst';
import { useDailyResetLabel } from '../../lib/useResetCountdown';

/**
 * Daily rewards: a 7-day track on Today. Open the app, claim today's reward, see tomorrow's.
 * Missing a day never takes anything away; 7 days in a row adds a bonus.
 */
export function CheckInCard() {
  const { state, dispatch } = useApp();
  const today = todayKey();
  const v = checkInView(state, today);
  const [justClaimed, setJustClaimed] = useState<string | null>(null);
  const resetLabel = useDailyResetLabel();
  const next = CHECKIN_REWARDS[v.nextDay - 1];
  const nextInfo = checkInRewardInfo(next);
  const todays = v.claimedToday ? checkInRewardInfo(CHECKIN_REWARDS[v.filled - 1]) : nextInfo;

  function claim() {
    if (v.claimedToday) return;
    dispatch({ type: 'CLAIM_CHECK_IN' });
    setJustClaimed(todays.title);
    try {
      navigator.vibrate?.([15, 40, 30]);
    } catch {
      // optional
    }
  }

  return (
    <section
      aria-label="Daily rewards"
      className={`relative overflow-hidden rounded-2xl border p-4 ${
        v.claimedToday ? 'border-white/10 bg-white/[0.03]' : 'checkin-ready border-amber-400/35'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Daily rewards</p>
          <p className="font-display font-bold text-white leading-snug">
            {v.claimedToday ? (justClaimed ? `You got ${justClaimed.toLowerCase()}!` : 'See you tomorrow') : `Day ${v.nextDay}: ${todays.title}`}
          </p>
        </div>
        {!v.claimedToday && (
          <button onClick={claim} className="attention shrink-0 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold px-4 py-2.5">
            Claim
          </button>
        )}
      </div>

      <ol className="mt-3 grid grid-cols-7 gap-1.5" aria-label="This week's rewards">
        {CHECKIN_REWARDS.map((r, i) => {
          const day = i + 1;
          const info = checkInRewardInfo(r);
          const done = day <= v.filled;
          const now = !v.claimedToday && day === v.nextDay;
          const big = day === 7;
          return (
            <li
              key={day}
              aria-label={`Day ${day}: ${info.title}${done ? ', claimed' : now ? ', ready' : ''}`}
              className={`relative rounded-xl border flex flex-col items-center justify-center py-1.5 min-h-[58px] ${
                done
                  ? 'border-emerald-400/40 bg-emerald-500/10'
                  : now
                    ? 'border-amber-400 bg-amber-500/15'
                    : big
                      ? 'border-fuchsia-400/40 bg-fuchsia-500/10'
                      : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              {done && justClaimed && day === v.filled && <Burst x="50%" y="40%" color="var(--color-amber-400)" size={1} sparks={10} />}
              <span className="text-[0.5625rem] font-bold text-slate-400 leading-none">D{day}</span>
              {done ? (
                <Icon name="✓" size={16} strokeWidth={3} className="text-emerald-300 my-0.5" />
              ) : (
                <Icon name={info.icon} size={16} className={`my-0.5 ${big ? 'text-fuchsia-300' : r.kind === 'shards' ? 'text-cyan-300' : 'text-amber-300'}`} />
              )}
              <span className={`max-w-full px-0.5 truncate text-center text-[0.5625rem] font-bold leading-tight ${done ? 'text-emerald-300' : 'text-slate-300'}`}>{info.short}</span>
            </li>
          );
        })}
      </ol>

      <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
        {v.claimedToday ? (
          <>
            Tomorrow (in {resetLabel}): <b className="text-slate-200">{v.nextDay === 1 ? 'a new week of rewards' : `Day ${v.nextDay}, ${nextInfo.title.toLowerCase()}`}</b>.
            {v.perfectPossible && v.filled < 7 && <> Keep going every day for a +{PERFECT_WEEK_BONUS} coin bonus on day 7.</>}
            {v.filled === 7 && v.inARow === 7 && <> Perfect week: +{PERFECT_WEEK_BONUS} bonus coins!</>}
          </>
        ) : v.perfectPossible ? (
          <>Claim 7 days in a row for a +{PERFECT_WEEK_BONUS} coin bonus. Missed a day? No problem, you keep what you have.</>
        ) : (
          <>Missed a day? No problem, your rewards are still here. Pick up where you left off.</>
        )}
      </p>
    </section>
  );
}
